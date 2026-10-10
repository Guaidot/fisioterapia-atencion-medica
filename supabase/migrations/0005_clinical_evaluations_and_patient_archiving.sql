-- Preserve patient records by archiving patients instead of cascading deletes.
alter table public.patients
  add column archived_at timestamptz;

create index patients_archived_at_idx on public.patients (archived_at);

-- A dated clinical evaluation combines the existing clinical history with triage.
alter table public.clinical_histories rename to clinical_evaluations;
alter policy "clinical_histories_staff_all" on public.clinical_evaluations
  rename to "clinical_evaluations_staff_all";

do $$
declare
  patient_fk record;
begin
  for patient_fk in
    select conname
    from pg_constraint
    where conrelid = 'public.clinical_evaluations'::regclass
      and confrelid = 'public.patients'::regclass
      and contype = 'f'
  loop
    execute format(
      'alter table public.clinical_evaluations drop constraint %I',
      patient_fk.conname
    );
  end loop;
end $$;

alter table public.clinical_evaluations
  add constraint clinical_evaluations_patient_id_fkey
  foreign key (patient_id) references public.patients(id) on delete restrict;

alter table public.clinical_evaluations
  add column blood_pressure_systolic integer,
  add column blood_pressure_diastolic integer,
  add column oxygen_saturation numeric(5, 2),
  add column temperature_celsius numeric(4, 2),
  add column heart_rate integer,
  add column sleep_hours text,
  add column sleep_quality text,
  add column blood_pressure_medications text[] not null default '{}',
  add column other_blood_pressure_medication text not null default '',
  add column other_medication text not null default '';

alter table public.clinical_evaluations
  add constraint clinical_evaluations_vitals_nonnegative_check check (
    (blood_pressure_systolic is null or blood_pressure_systolic > 0)
    and (blood_pressure_diastolic is null or blood_pressure_diastolic > 0)
    and (oxygen_saturation is null or oxygen_saturation between 0 and 100)
    and (temperature_celsius is null or temperature_celsius > 0)
    and (heart_rate is null or heart_rate > 0)
  ),
  add constraint clinical_evaluations_sleep_hours_check check (
    sleep_hours is null or sleep_hours in ('menos_4', '4_6', '6_8', 'mas_8')
  ),
  add constraint clinical_evaluations_sleep_quality_check check (
    sleep_quality is null or sleep_quality in ('interrumpido', 'superficial', 'reparador')
  ),
  add constraint clinical_evaluations_bp_medications_check check (
    blood_pressure_medications <@ array['captopril', 'enalapril', 'losartan', 'amlodipina', 'otro']::text[]
  );

create index clinical_evaluations_patient_created_at_idx
  on public.clinical_evaluations (patient_id, created_at desc);

comment on table public.clinical_evaluations is
  'Evaluaciones clínicas fechadas con diagnóstico, EVA, signos vitales, sueño y medicamentos.';
