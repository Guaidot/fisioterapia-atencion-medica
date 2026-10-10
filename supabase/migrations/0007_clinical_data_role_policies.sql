create or replace function public.is_admin()
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
      and p.role = 'admin'::public.user_role
      and p.is_active
  );
$$;

create or replace function public.has_clinical_access()
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
      and p.role in (
        'admin'::public.user_role,
        'terapeuta'::public.user_role,
        'asistente'::public.user_role
      )
  );
$$;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.has_clinical_access() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.has_clinical_access() to authenticated;

drop policy if exists "patients_staff_all" on public.patients;
create policy "patients_clinical_staff_all"
  on public.patients
  for all
  to authenticated
  using (public.has_clinical_access())
  with check (public.has_clinical_access());

drop policy if exists "clinical_evaluations_staff_all" on public.clinical_evaluations;
create policy "clinical_evaluations_clinical_staff_all"
  on public.clinical_evaluations
  for all
  to authenticated
  using (public.has_clinical_access())
  with check (public.has_clinical_access());

create or replace function public.protect_clinical_record_attribution()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if (select auth.uid()) is not null then
      new.created_by := (select auth.uid());
    end if;
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;

  return new;
end;
$$;

drop trigger if exists patients_protect_attribution on public.patients;
create trigger patients_protect_attribution
  before insert or update on public.patients
  for each row execute function public.protect_clinical_record_attribution();

drop trigger if exists clinical_evaluations_protect_attribution on public.clinical_evaluations;
create trigger clinical_evaluations_protect_attribution
  before insert or update on public.clinical_evaluations
  for each row execute function public.protect_clinical_record_attribution();
