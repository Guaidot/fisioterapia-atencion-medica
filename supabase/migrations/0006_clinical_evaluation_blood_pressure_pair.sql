alter table public.clinical_evaluations
  add constraint clinical_evaluations_blood_pressure_pair_check check (
    (blood_pressure_systolic is null and blood_pressure_diastolic is null)
    or (blood_pressure_systolic is not null and blood_pressure_diastolic is not null)
  );
