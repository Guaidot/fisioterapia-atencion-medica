create or replace function public.can_create_treatment_exercise()
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
      and p.role = 'terapeuta'::public.user_role
      and p.is_active
  );
$$;

revoke all on function public.can_create_treatment_exercise() from public, anon;
grant execute on function public.can_create_treatment_exercise() to authenticated;

create policy "treatment_catalog_therapist_exercise_insert"
  on public.treatment_catalog_items
  for insert
  to authenticated
  with check (
    kind = 'exercise'
    and public.can_create_treatment_exercise()
  );
