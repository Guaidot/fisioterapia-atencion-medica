alter table public.clinical_evaluations
  alter column eva_score drop not null,
  alter column eva_score drop default,
  add column clinical_observations text not null default '',
  add column vitals_measured_at timestamptz;

alter table public.clinical_evaluations
  add constraint clinical_evaluations_eva_score_optional_check
  check (eva_score is null or eva_score between 0 and 10),
  add constraint clinical_evaluations_observations_length_check
  check (length(clinical_observations) <= 2000);

comment on column public.clinical_evaluations.eva_score is
  'Pain score when assessed; null means it was not recorded.';

comment on column public.clinical_evaluations.clinical_observations is
  'Free-text clinical observations belonging to this evaluation/session.';

comment on column public.clinical_evaluations.vitals_measured_at is
  'Timestamp of vital-sign measurement, stored as timestamptz; displayed in the clinic timezone.';
