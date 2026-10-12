alter table public.treatment_interventions
  add column illustration_key text,
  add constraint treatment_interventions_illustration_key_check
  check (
    illustration_key is null or illustration_key in (
      'knee_extension_sitting',
      'straight_leg_raise',
      'straight_leg_raise_extended',
      'bridge',
      'heel_raise',
      'ankle_pumps',
      'shoulder_flexion',
      'neck_rotation',
      'neck_rotation_right',
      'knee_flexion_standing'
    )
  );

alter table public.treatment_interventions
  add constraint treatment_interventions_illustration_kind_check
  check (illustration_key is null or kind = 'exercise');
