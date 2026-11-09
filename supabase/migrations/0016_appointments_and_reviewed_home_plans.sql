create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  scheduled_at timestamptz not null,
  duration_minutes integer check (duration_minutes is null or duration_minutes between 5 and 1440),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'attended', 'no_show', 'rescheduled', 'cancelled')),
  rescheduled_from_id uuid references public.appointments(id) on delete restrict,
  rescheduled_to_id uuid unique references public.appointments(id) on delete restrict,
  clinical_evaluation_id uuid unique references public.clinical_evaluations(id) on delete restrict,
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'rescheduled') = (rescheduled_to_id is not null)),
  check (status <> 'attended' or clinical_evaluation_id is not null)
);

create index appointments_scheduled_at_idx on public.appointments (scheduled_at);
create index appointments_patient_scheduled_at_idx on public.appointments (patient_id, scheduled_at desc);
create unique index appointments_one_reschedule_per_original_idx
  on public.appointments (rescheduled_from_id)
  where rescheduled_from_id is not null;

alter table public.appointments enable row level security;
create or replace function public.has_agenda_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_active
      and p.role in ('admin'::public.user_role, 'terapeuta'::public.user_role)
  );
$$;

create policy "appointments_clinical_staff_select"
  on public.appointments for select to authenticated
  using (public.has_agenda_access());
create policy "appointments_clinical_staff_insert"
  on public.appointments for insert to authenticated
  with check (public.has_agenda_access());
create policy "appointments_clinical_staff_update"
  on public.appointments for update to authenticated
  using (public.has_agenda_access())
  with check (public.has_agenda_access());

revoke update on public.appointments from authenticated;
grant update (status) on public.appointments to authenticated;

alter table public.clinical_evaluations
  add column appointment_id uuid unique
    references public.appointments(id) on delete restrict,
  add column home_exercise_plan_reviewed_at timestamptz,
  add column home_exercise_plan_reviewed_by uuid references public.profiles(id) on delete set null;

create or replace function public.guard_clinical_evaluation_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.home_exercise_plan_reviewed_at is not null
      or new.home_exercise_plan_reviewed_by is not null then
      raise exception 'La revisión de la pauta debe confirmarse mediante la acción profesional.';
    end if;
  else
    if new.appointment_id is distinct from old.appointment_id then
      raise exception 'La cita vinculada a una evaluación no se puede cambiar.';
    end if;
    if (
      new.home_exercise_plan_reviewed_at is distinct from old.home_exercise_plan_reviewed_at
      or new.home_exercise_plan_reviewed_by is distinct from old.home_exercise_plan_reviewed_by
    ) and coalesce(current_setting('app.reviewed_plan_action', true), '')
      not in ('confirm', 'invalidate') then
      raise exception 'La revisión de la pauta solo puede cambiarse mediante el flujo autorizado.';
    end if;
  end if;
  return new;
end;
$$;

create trigger clinical_evaluations_guard_metadata
  before insert or update on public.clinical_evaluations
  for each row execute function public.guard_clinical_evaluation_metadata();

create or replace function public.guard_appointment_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_agenda_access() then
    raise exception 'No tienes permiso para usar la agenda.';
  end if;
  if new.scheduled_at <= now() then
    raise exception 'La cita debe programarse en una fecha futura.';
  end if;
  new.created_by := auth.uid();
  new.created_at := now();
  new.updated_at := new.created_at;
  if new.status <> 'scheduled' or new.rescheduled_to_id is not null
    or new.clinical_evaluation_id is not null then
    raise exception 'Una cita nueva debe iniciar programada y sin atención asociada.';
  end if;
  if new.rescheduled_from_id is not null
    and current_setting('app.rescheduling_appointment', true) is distinct from 'on' then
    raise exception 'Las reprogramaciones deben realizarse mediante el flujo de agenda.';
  end if;
  if not exists (
    select 1 from public.patients p
    where p.id = new.patient_id and p.archived_at is null
  ) then
    raise exception 'No se puede agendar a un paciente inexistente o archivado.';
  end if;
  return new;
end;
$$;

create trigger appointments_guard_insert
  before insert on public.appointments
  for each row execute function public.guard_appointment_insert();

create or replace function public.guard_appointment_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.patient_id is distinct from old.patient_id
    or new.scheduled_at is distinct from old.scheduled_at
    or new.duration_minutes is distinct from old.duration_minutes
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Los datos originales de una cita se conservan; reprográmala para cambiar la fecha.';
  end if;

  if old.status <> 'scheduled' then
    raise exception 'Solo se puede cambiar una cita que continúa programada.';
  end if;

  if new.status in ('cancelled', 'no_show') then
    if new.rescheduled_to_id is not null or new.clinical_evaluation_id is not null then
      raise exception 'No se puede cancelar o marcar inasistencia en una cita vinculada.';
    end if;
  elsif new.status = 'rescheduled' then
    if current_setting('app.rescheduling_appointment', true) is distinct from 'on'
      or new.rescheduled_to_id is null
      or new.clinical_evaluation_id is not null then
      raise exception 'Usa el flujo de reprogramación para conservar el historial.';
    end if;
  elsif new.status = 'attended' then
    if new.clinical_evaluation_id is null
      or not exists (
        select 1 from public.clinical_evaluations e
        where e.id = new.clinical_evaluation_id
          and e.appointment_id = old.id
          and e.patient_id = old.patient_id
      ) then
      raise exception 'Una cita se marca atendida al guardar su evaluación clínica.';
    end if;
  else
    raise exception 'Transición de estado de cita no válida.';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger appointments_guard_update
  before update on public.appointments
  for each row execute function public.guard_appointment_update();

create or replace function public.attach_evaluation_to_appointment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.appointment_id is null then
    return new;
  end if;
  if not public.has_agenda_access() then
    raise exception 'No tienes permiso para asociar una evaluación a una cita.';
  end if;

  update public.appointments a
  set status = 'attended',
      clinical_evaluation_id = new.id
  where a.id = new.appointment_id
    and a.patient_id = new.patient_id
    and a.status = 'scheduled';

  if not found then
    raise exception 'La cita no está programada o no corresponde a este paciente.';
  end if;
  return new;
end;
$$;

create trigger clinical_evaluations_attach_appointment
  after insert on public.clinical_evaluations
  for each row when (new.appointment_id is not null)
  execute function public.attach_evaluation_to_appointment();

create or replace function public.reschedule_appointment(
  p_appointment_id uuid,
  p_scheduled_at timestamptz,
  p_duration_minutes integer default null
)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_original public.appointments;
  v_replacement public.appointments;
begin
  if not public.has_agenda_access() then
    raise exception 'No tienes permiso para reprogramar citas.';
  end if;
  if p_scheduled_at <= now()
    or (p_duration_minutes is not null and p_duration_minutes not between 5 and 1440) then
    raise exception 'La nueva fecha o duración no son válidas.';
  end if;

  select * into v_original
  from public.appointments
  where id = p_appointment_id
  for update;
  if not found or v_original.status <> 'scheduled' then
    raise exception 'Solo se pueden reprogramar citas que continúan programadas.';
  end if;
  if not exists (
    select 1 from public.patients p
    where p.id = v_original.patient_id and p.archived_at is null
  ) then
    raise exception 'No se puede reprogramar una cita para un paciente archivado.';
  end if;

  perform set_config('app.rescheduling_appointment', 'on', true);
  insert into public.appointments (
    patient_id, scheduled_at, duration_minutes, status, rescheduled_from_id, created_by
  ) values (
    v_original.patient_id, p_scheduled_at, p_duration_minutes, 'scheduled',
    v_original.id, auth.uid()
  )
  returning * into v_replacement;

  update public.appointments
  set status = 'rescheduled', rescheduled_to_id = v_replacement.id
  where id = v_original.id;

  return v_replacement;
end;
$$;

revoke all on function public.reschedule_appointment(uuid, timestamptz, integer) from public, anon;
grant execute on function public.reschedule_appointment(uuid, timestamptz, integer) to authenticated;
revoke all on function public.guard_appointment_insert() from public, anon, authenticated;
revoke all on function public.guard_appointment_update() from public, anon, authenticated;
revoke all on function public.attach_evaluation_to_appointment() from public, anon, authenticated;
revoke all on function public.guard_clinical_evaluation_metadata() from public, anon, authenticated;
revoke all on function public.has_agenda_access() from public, anon;
grant execute on function public.has_agenda_access() to authenticated;

alter table public.clinical_audit_logs
  drop constraint clinical_audit_logs_entity_type_check;
alter table public.clinical_audit_logs
  add constraint clinical_audit_logs_entity_type_check
  check (entity_type in (
    'patient',
    'clinical_evaluation',
    'treatment_intervention',
    'rom_measurement',
    'treatment_catalog_item',
    'appointment'
  ));

create or replace function public.capture_appointment_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_record_id uuid;
  v_patient_id uuid;
  v_old_data jsonb;
  v_new_data jsonb;
begin
  if tg_op = 'INSERT' then
    v_record_id := new.id;
    v_patient_id := new.patient_id;
    v_new_data := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    v_record_id := new.id;
    v_patient_id := new.patient_id;
    v_old_data := to_jsonb(old);
    v_new_data := to_jsonb(new);
  else
    v_record_id := old.id;
    v_patient_id := old.patient_id;
    v_old_data := to_jsonb(old);
  end if;

  insert into public.clinical_audit_logs (
    entity_type, record_id, patient_id, action, actor_id, old_data, new_data
  ) values (
    'appointment',
    v_record_id,
    v_patient_id,
    tg_op,
    (select auth.uid()),
    v_old_data,
    v_new_data
  );
  return null;
end;
$$;

create trigger appointments_clinical_audit_log
  after insert or update or delete on public.appointments
  for each row execute function public.capture_appointment_audit_log();
revoke all on function public.capture_appointment_audit_log() from public, anon, authenticated;

create or replace function public.confirm_home_exercise_plan_review(p_evaluation_id uuid)
returns public.clinical_evaluations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_evaluation public.clinical_evaluations;
begin
  if not public.has_agenda_access() then
    raise exception 'No tienes permiso para confirmar la revisión de la pauta.';
  end if;
  select * into v_evaluation
  from public.clinical_evaluations
  where id = p_evaluation_id
  for update;
  if not found then
    raise exception 'No se encontró la evaluación.';
  end if;
  if not exists (
    select 1 from public.treatment_interventions i
    where i.clinical_evaluation_id = p_evaluation_id and i.kind = 'exercise'
  ) then
    raise exception 'La evaluación no tiene ejercicios para revisar.';
  end if;

  perform set_config('app.reviewed_plan_action', 'confirm', true);
  update public.clinical_evaluations
  set home_exercise_plan_reviewed_at = now(),
      home_exercise_plan_reviewed_by = auth.uid()
  where id = p_evaluation_id
  returning * into v_evaluation;
  return v_evaluation;
end;
$$;

create or replace function public.invalidate_reviewed_plan_on_exercise_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.kind <> 'exercise' then
      return null;
    end if;
    perform set_config('app.reviewed_plan_action', 'invalidate', true);
    update public.clinical_evaluations
    set home_exercise_plan_reviewed_at = null,
        home_exercise_plan_reviewed_by = null
    where id = old.clinical_evaluation_id
      and home_exercise_plan_reviewed_at is not null;
    return null;
  end if;
  if tg_op = 'UPDATE' then
    if old.kind = 'exercise' then
      perform set_config('app.reviewed_plan_action', 'invalidate', true);
      update public.clinical_evaluations
      set home_exercise_plan_reviewed_at = null,
          home_exercise_plan_reviewed_by = null
      where id = old.clinical_evaluation_id
        and home_exercise_plan_reviewed_at is not null;
    end if;
  end if;
  if new.kind = 'exercise' then
    perform set_config('app.reviewed_plan_action', 'invalidate', true);
    update public.clinical_evaluations
    set home_exercise_plan_reviewed_at = null,
        home_exercise_plan_reviewed_by = null
    where id = new.clinical_evaluation_id
      and home_exercise_plan_reviewed_at is not null;
  end if;
  return null;
end;
$$;

create trigger treatment_interventions_invalidate_review
  after insert or update or delete on public.treatment_interventions
  for each row execute function public.invalidate_reviewed_plan_on_exercise_change();

revoke all on function public.confirm_home_exercise_plan_review(uuid) from public, anon;
grant execute on function public.confirm_home_exercise_plan_review(uuid) to authenticated;
revoke all on function public.invalidate_reviewed_plan_on_exercise_change() from public, anon, authenticated;
