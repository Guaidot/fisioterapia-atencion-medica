create table public.clinical_audit_logs (
  id bigint generated always as identity primary key,
  entity_type text not null check (entity_type in ('patient', 'clinical_evaluation')),
  record_id uuid not null,
  patient_id uuid,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor_id uuid references public.profiles(id) on delete set null,
  occurred_at timestamptz not null default now(),
  old_data jsonb,
  new_data jsonb
);

comment on table public.clinical_audit_logs is
  'Registro de solo lectura de cambios en pacientes y evaluaciones clínicas.';

create index clinical_audit_logs_occurred_at_idx
  on public.clinical_audit_logs (occurred_at desc);
create index clinical_audit_logs_patient_id_occurred_at_idx
  on public.clinical_audit_logs (patient_id, occurred_at desc);

alter table public.clinical_audit_logs enable row level security;

revoke all on table public.clinical_audit_logs from anon, authenticated;
grant select on table public.clinical_audit_logs to authenticated;

create policy "clinical_audit_logs_admin_read"
  on public.clinical_audit_logs
  for select
  to authenticated
  using (public.is_admin());

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

  if tg_table_name = 'patients' then
    v_entity_type := 'patient';
    v_record_id := (v_record ->> 'id')::uuid;
    v_patient_id := v_record_id;
  else
    v_entity_type := 'clinical_evaluation';
    v_record_id := (v_record ->> 'id')::uuid;
    v_patient_id := (v_record ->> 'patient_id')::uuid;
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

revoke all on function public.capture_clinical_audit_log() from public, anon, authenticated;

create trigger patients_clinical_audit_log
  after insert or update or delete on public.patients
  for each row execute function public.capture_clinical_audit_log();

create trigger clinical_evaluations_clinical_audit_log
  after insert or update or delete on public.clinical_evaluations
  for each row execute function public.capture_clinical_audit_log();
