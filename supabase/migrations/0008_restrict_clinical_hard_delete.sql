drop policy if exists "patients_clinical_staff_all" on public.patients;
drop policy if exists "clinical_evaluations_clinical_staff_all"
  on public.clinical_evaluations;

create policy "patients_clinical_staff_select"
  on public.patients
  for select
  to authenticated
  using (public.has_clinical_access());

create policy "patients_clinical_staff_insert"
  on public.patients
  for insert
  to authenticated
  with check (public.has_clinical_access());

create policy "patients_clinical_staff_update"
  on public.patients
  for update
  to authenticated
  using (public.has_clinical_access())
  with check (public.has_clinical_access());

create policy "patients_admin_delete"
  on public.patients
  for delete
  to authenticated
  using (public.is_admin());

create policy "clinical_evaluations_clinical_staff_select"
  on public.clinical_evaluations
  for select
  to authenticated
  using (public.has_clinical_access());

create policy "clinical_evaluations_clinical_staff_insert"
  on public.clinical_evaluations
  for insert
  to authenticated
  with check (public.has_clinical_access());

create policy "clinical_evaluations_clinical_staff_update"
  on public.clinical_evaluations
  for update
  to authenticated
  using (public.has_clinical_access())
  with check (public.has_clinical_access());

create policy "clinical_evaluations_admin_delete"
  on public.clinical_evaluations
  for delete
  to authenticated
  using (public.is_admin());
