-- ============================================================
-- FASE 1: profiles (auth + roles), patients, clinical_histories
-- ============================================================

-- Enum de roles
do $$ begin
  create type user_role as enum ('admin', 'terapeuta', 'asistente');
exception when duplicate_object then null; end $$;

-- Tabla de perfiles (vinculada a auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role user_role not null default 'terapeuta',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfiles de usuario con rol; 1-1 con auth.users';

-- Trigger: crear perfil automáticamente al registrarse un auth user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RPC: crear usuario (solo admin)
create or replace function public.admin_create_user(
  p_email text, p_password text, p_full_name text, p_role text
) returns uuid
language plpgsql security definer as $$
declare
  v_uid uuid;
begin
  if p_role not in ('admin', 'terapeuta', 'asistente') then
    raise exception 'Rol inválido';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  ) then
    raise exception 'Solo un administrador puede asignar roles';
  end if;

  select auth.admin_create_user(
    email => p_email,
    password => p_password,
    email_confirm => true,
    user_metadata => jsonb_build_object('full_name', p_full_name)
  ) into v_uid;

  update public.profiles set role = p_role::user_role where id = v_uid;

  return v_uid;
exception when others then
  raise exception 'No se pudo crear el usuario: %', sqlerrm;
end $$;

-- RPC: bootstrap primer admin (solo si profiles está vacío)
create or replace function public.bootstrap_first_admin(
  p_email text, p_password text, p_full_name text
) returns uuid
language plpgsql security definer as $$
declare
  v_count bigint;
  v_uid uuid;
begin
  select count(*) into v_count from public.profiles;
  if v_count > 0 then
    raise exception 'Ya existen perfiles; use admin_create_user';
  end if;

  select auth.admin_create_user(
    email => p_email,
    password => p_password,
    email_confirm => true,
    user_metadata => jsonb_build_object('full_name', p_full_name)
  ) into v_uid;

  update public.profiles set role = 'admin' where id = v_uid;

  return v_uid;
end $$;

-- ============================================================
-- Patients
-- ============================================================
create table if not exists public.patients (
  id uuid primary key default uuid_generate_v4(),
  first_name text not null,
  last_name text not null,
  cedula text not null,
  birth_date date,
  gender text not null check (gender in ('femenino', 'masculino', 'otro')),
  phone text default '',
  occupation text default '',
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cedula)
);

-- ============================================================
-- Clinical histories
-- ============================================================
do $$ begin
  create type lesion_type as enum ('articular', 'muscular', 'tendinosa', 'ligamentosa', 'neurologica', 'osea');
exception when duplicate_object then null; end $$;

do $$ begin
  create type anatomical_zone as enum ('hombro', 'rodilla', 'columna', 'codo', 'tobillo', 'cadera', 'muneca', 'cuello');
exception when duplicate_object then null; end $$;

do $$ begin
  create type evolution_phase as enum ('aguda', 'subaguda', 'cronica');
exception when duplicate_object then null; end $$;

create table if not exists public.clinical_histories (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  diagnosis text not null,
  lesion_type lesion_type not null,
  zone anatomical_zone not null,
  phase evolution_phase not null,
  eva_score int not null default 0 check (eva_score between 0 and 10),
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.clinical_histories is 'Historias clínicas; relación N:1 con patients';

-- ============================================================
-- RLS: habilitar y políticas
-- ============================================================
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.clinical_histories enable row level security;

-- Profiles
create policy "profiles_own_read" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_admin_read" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "profiles_admin_update" on public.profiles
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Patients
create policy "patients_staff_all" on public.patients
  for all using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Clinical histories
create policy "clinical_histories_staff_all" on public.clinical_histories
  for all using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ============================================================
-- Storage buckets (placeholder)
-- ============================================================
insert into storage.buckets (id, name) values
  ('anatomical-images', 'anatomical-images'),
  ('exercise-media', 'exercise-media'),
  ('reports', 'reports')
on conflict (id) do nothing;

-- ============================================================
-- Seed: anatomical_resources (placeholder)
-- ============================================================
create table if not exists public.anatomical_resources (
  zone anatomical_zone primary key,
  image_url text not null,
  description text
);

insert into public.anatomical_resources (zone, image_url, description) values
  ('hombro', '/placeholder/anatomical/shoulder.svg', 'Articulación glenohumeral'),
  ('rodilla', '/placeholder/anatomical/knee.svg', 'Articulación de rodilla'),
  ('columna', '/placeholder/anatomical/spine.svg', 'Columna vertebral'),
  ('codo', '/placeholder/anatomical/elbow.svg', 'Articulación del codo'),
  ('tobillo', '/placeholder/anatomical/ankle.svg', 'Articulación del tobillo'),
  ('cadera', '/placeholder/anatomical/hip.svg', 'Articulación de la cadera'),
  ('muneca', '/placeholder/anatomical/wrist.svg', 'Articulación de la muñeca'),
  ('cuello', '/placeholder/anatomical/neck.svg', 'Segmento cervical')
on conflict (zone) do nothing;