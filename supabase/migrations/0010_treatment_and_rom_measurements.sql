create table public.treatment_interventions (
  id uuid primary key default uuid_generate_v4(),
  clinical_evaluation_id uuid not null
    references public.clinical_evaluations(id) on delete restrict,
  kind text not null check (kind in ('exercise', 'physical_agent')),
  name text not null check (length(btrim(name)) between 1 and 200),
  contraction text check (
    contraction is null or contraction in ('isometrica', 'concentrica', 'excentrica')
  ),
  sets integer check (sets is null or sets > 0),
  repetitions integer check (repetitions is null or repetitions > 0),
  duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  rest_seconds integer check (rest_seconds is null or rest_seconds >= 0),
  frequency_per_week integer check (frequency_per_week is null or frequency_per_week > 0),
  technical_frequency_hz numeric(8, 2) check (
    technical_frequency_hz is null or technical_frequency_hz > 0
  ),
  intensity numeric(8, 2) check (intensity is null or intensity > 0),
  intensity_unit text check (intensity_unit is null or intensity_unit in ('mA', 'W', 'W/cm2')),
  application_minutes integer check (application_minutes is null or application_minutes > 0),
  mode text check (mode is null or mode in ('continuo', 'pulsado')),
  instructions text not null default '',
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint treatment_interventions_kind_parameters_check check (
    (kind = 'exercise' and technical_frequency_hz is null and intensity is null
      and intensity_unit is null and application_minutes is null and mode is null)
    or
    (kind = 'physical_agent' and contraction is null and sets is null and repetitions is null
      and duration_seconds is null and rest_seconds is null and frequency_per_week is null)
  ),
  constraint treatment_interventions_required_dose_check check (
    (kind = 'exercise' and (sets is not null or repetitions is not null or duration_seconds is not null))
    or (kind = 'physical_agent' and application_minutes is not null)
  )
);

create table public.rom_measurements (
  id uuid primary key default uuid_generate_v4(),
  clinical_evaluation_id uuid not null
    references public.clinical_evaluations(id) on delete restrict,
  joint text not null check (length(btrim(joint)) between 1 and 100),
  movement text not null check (length(btrim(movement)) between 1 and 100),
  side text check (side is null or side in ('izquierdo', 'derecho', 'bilateral')),
  degrees numeric(6, 2) not null check (degrees between 0 and 360),
  reference_min_degrees numeric(6, 2) check (
    reference_min_degrees is null or reference_min_degrees between 0 and 360
  ),
  reference_max_degrees numeric(6, 2) check (
    reference_max_degrees is null or reference_max_degrees between 0 and 360
  ),
  notes text not null default '',
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rom_measurements_reference_range_check check (
    (reference_min_degrees is null or reference_max_degrees is null)
    or reference_min_degrees <= reference_max_degrees
  )
);

create index treatment_interventions_evaluation_idx
  on public.treatment_interventions (clinical_evaluation_id, created_at desc);
create index rom_measurements_evaluation_idx
  on public.rom_measurements (clinical_evaluation_id, created_at desc);

alter table public.treatment_interventions enable row level security;
alter table public.rom_measurements enable row level security;

create policy "treatment_interventions_clinical_staff_select"
  on public.treatment_interventions
  for select to authenticated using (public.has_clinical_access());
create policy "treatment_interventions_clinical_staff_insert"
  on public.treatment_interventions
  for insert to authenticated with check (public.has_clinical_access());
create policy "treatment_interventions_clinical_staff_update"
  on public.treatment_interventions
  for update to authenticated
  using (public.has_clinical_access()) with check (public.has_clinical_access());
create policy "treatment_interventions_admin_delete"
  on public.treatment_interventions
  for delete to authenticated using (public.is_admin());

create policy "rom_measurements_clinical_staff_select"
  on public.rom_measurements
  for select to authenticated using (public.has_clinical_access());
create policy "rom_measurements_clinical_staff_insert"
  on public.rom_measurements
  for insert to authenticated with check (public.has_clinical_access());
create policy "rom_measurements_clinical_staff_update"
  on public.rom_measurements
  for update to authenticated
  using (public.has_clinical_access()) with check (public.has_clinical_access());
create policy "rom_measurements_admin_delete"
  on public.rom_measurements
  for delete to authenticated using (public.is_admin());

create trigger treatment_interventions_protect_attribution
  before insert or update on public.treatment_interventions
  for each row execute function public.protect_clinical_record_attribution();
create trigger rom_measurements_protect_attribution
  before insert or update on public.rom_measurements
  for each row execute function public.protect_clinical_record_attribution();

alter table public.clinical_audit_logs
  drop constraint clinical_audit_logs_entity_type_check;
alter table public.clinical_audit_logs
  add constraint clinical_audit_logs_entity_type_check
  check (entity_type in (
    'patient',
    'clinical_evaluation',
    'treatment_intervention',
    'rom_measurement'
  ));

create or replace function public.capture_clinical_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_data jsonb;
  v_new_data jsonb;
  v_record jsonb;
  v_entity_type text;
  v_record_id uuid;
  v_patient_id uuid;
  v_evaluation_id uuid;
begin
  if tg_op = 'INSERT' then
    v_new_data := to_jsonb(new);
    v_record := v_new_data;
  elsif tg_op = 'UPDATE' then
    select coalesce(jsonb_object_agg(old_entry.key, old_entry.value), '{}'::jsonb)
      into v_old_data
      from jsonb_each(to_jsonb(old)) as old_entry(key, value)
      where to_jsonb(new) -> old_entry.key is distinct from old_entry.value;
    select coalesce(jsonb_object_agg(new_entry.key, new_entry.value), '{}'::jsonb)
      into v_new_data
      from jsonb_each(to_jsonb(new)) as new_entry(key, value)
      where to_jsonb(old) -> new_entry.key is distinct from new_entry.value;
    v_record := to_jsonb(new);
  else
    v_old_data := to_jsonb(old);
    v_record := v_old_data;
  end if;

  v_record_id := (v_record ->> 'id')::uuid;
  if tg_table_name = 'patients' then
    v_entity_type := 'patient';
    v_patient_id := v_record_id;
  elsif tg_table_name = 'clinical_evaluations' then
    v_entity_type := 'clinical_evaluation';
    v_patient_id := (v_record ->> 'patient_id')::uuid;
  else
    v_entity_type := case tg_table_name
      when 'treatment_interventions' then 'treatment_intervention'
      else 'rom_measurement'
    end;
    v_evaluation_id := (v_record ->> 'clinical_evaluation_id')::uuid;
    select e.patient_id into v_patient_id
      from public.clinical_evaluations e
      where e.id = v_evaluation_id;
    if v_patient_id is null and tg_op = 'DELETE' then
      select e.patient_id into v_patient_id
        from public.clinical_evaluations e
        where e.id = (to_jsonb(old) ->> 'clinical_evaluation_id')::uuid;
    end if;
  end if;

  insert into public.clinical_audit_logs (
    entity_type,
    record_id,
    patient_id,
    action,
    actor_id,
    old_data,
    new_data
  ) values (
    v_entity_type,
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

create trigger treatment_interventions_clinical_audit_log
  after insert or update or delete on public.treatment_interventions
  for each row execute function public.capture_clinical_audit_log();
create trigger rom_measurements_clinical_audit_log
  after insert or update or delete on public.rom_measurements
  for each row execute function public.capture_clinical_audit_log();
