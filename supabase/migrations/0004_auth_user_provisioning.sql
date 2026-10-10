-- Public self-registration must never choose a privileged role.
alter table public.profiles
  alter column role set default 'asistente'::public.user_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'asistente'::public.user_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- User creation now goes through the secured provision-user Edge Function.
drop function if exists public.admin_create_user(text, text, text, text);
drop function if exists public.bootstrap_first_admin(text, text, text);