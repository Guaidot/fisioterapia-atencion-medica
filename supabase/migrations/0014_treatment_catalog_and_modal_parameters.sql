create table public.treatment_catalog_items (
  id uuid primary key default uuid_generate_v4(),
  kind text not null check (kind in ('exercise', 'physical_agent')),
  code text not null check (code ~ '^[a-z0-9]+([-_][a-z0-9]+)*$'),
  name text not null check (length(btrim(name)) between 1 and 200),
  description text not null default '' check (length(description) <= 1000),
  active boolean not null default true,
  illustration_key text,
  parameter_config jsonb not null default '{}'::jsonb
    check (jsonb_typeof(parameter_config) = 'object'),
  created_by uuid default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, code),
  constraint treatment_catalog_kind_config_check check (
    (kind = 'exercise' and parameter_config = '{}'::jsonb)
    or kind = 'physical_agent'
  ),
  constraint treatment_catalog_kind_illustration_check check (
    kind = 'exercise' or illustration_key is null
  ),
  constraint treatment_catalog_agent_parameter_config_check check (
    kind <> 'physical_agent'
    or (
      jsonb_typeof(coalesce(parameter_config -> 'fields', '[]'::jsonb)) = 'array'
      and jsonb_typeof(coalesce(parameter_config -> 'intensityUnits', '[]'::jsonb)) = 'array'
      and (parameter_config - 'fields' - 'intensityUnits') = '{}'::jsonb
      and coalesce(parameter_config -> 'fields', '[]'::jsonb)
        <@ '["technicalFrequencyHz","intensity","applicationMinutes","mode"]'::jsonb
      and coalesce(parameter_config -> 'intensityUnits', '[]'::jsonb)
        <@ '["mA","W","W/cm2"]'::jsonb
      and (
        coalesce(parameter_config -> 'fields', '[]'::jsonb) @> '["intensity"]'::jsonb
      ) = (jsonb_array_length(coalesce(parameter_config -> 'intensityUnits', '[]'::jsonb)) > 0)
    )
  )
);

create index treatment_catalog_active_kind_name_idx
  on public.treatment_catalog_items (active, kind, name);

alter table public.treatment_catalog_items enable row level security;
create policy "treatment_catalog_clinical_staff_select"
  on public.treatment_catalog_items
  for select to authenticated using (public.has_clinical_access());
create policy "treatment_catalog_admin_insert"
  on public.treatment_catalog_items
  for insert to authenticated with check (public.is_admin());
create policy "treatment_catalog_admin_update"
  on public.treatment_catalog_items
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create or replace function public.protect_treatment_catalog_attribution()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := (select auth.uid());
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.protect_treatment_catalog_attribution() from public, anon, authenticated;

create trigger treatment_catalog_protect_attribution
  before insert or update on public.treatment_catalog_items
  for each row execute function public.protect_treatment_catalog_attribution();

alter table public.treatment_interventions
  add column catalog_item_id uuid references public.treatment_catalog_items(id) on delete set null;

alter table public.treatment_interventions
  drop constraint treatment_interventions_required_dose_check;

create or replace function public.validate_treatment_intervention_catalog()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_kind text;
  v_active boolean;
begin
  if new.catalog_item_id is null then
    return new;
  end if;

  select item.kind, item.active
    into v_kind, v_active
    from public.treatment_catalog_items item
    where item.id = new.catalog_item_id;

  if v_kind is null or not v_active or v_kind <> new.kind then
    raise exception 'El elemento de catálogo no existe, está inactivo o no corresponde al tipo.';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_treatment_intervention_catalog() from public, anon, authenticated;

create trigger treatment_interventions_validate_catalog
  before insert or update of catalog_item_id, kind
  on public.treatment_interventions
  for each row execute function public.validate_treatment_intervention_catalog();

comment on table public.treatment_catalog_items is
  'Clinic-maintained exercise and physical-agent catalog; agent parameters are configurable metadata, not clinical prescriptions.';
comment on column public.treatment_catalog_items.parameter_config is
  'Supported parameter fields and units/options for an agent; fields are optional and contain no suggested dose.';
comment on column public.treatment_interventions.catalog_item_id is
  'Optional catalog link; the intervention name remains a historical snapshot.';

insert into public.treatment_catalog_items (kind, code, name, illustration_key) values
  ('exercise', 'knee-extension-sitting', 'Extensión de rodilla sentado', 'knee_extension_sitting'),
  ('exercise', 'straight-leg-raise', 'Elevación de pierna recta', 'straight_leg_raise'),
  ('exercise', 'straight-leg-raise-extended', 'Elevación de una pierna en extensión', 'straight_leg_raise_extended'),
  ('exercise', 'bridge', 'Puente de glúteos', 'bridge'),
  ('exercise', 'heel-raise', 'Elevación de talones de pie', 'heel_raise'),
  ('exercise', 'ankle-pumps', 'Bombeo de tobillo', 'ankle_pumps'),
  ('exercise', 'shoulder-flexion', 'Elevación de brazos al frente', 'shoulder_flexion'),
  ('exercise', 'neck-rotation', 'Rotación de cuello hacia la izquierda', 'neck_rotation'),
  ('exercise', 'neck-rotation-right', 'Rotación de cuello hacia la derecha', 'neck_rotation_right'),
  ('exercise', 'knee-flexion-standing', 'Flexión de rodilla de pie con apoyo', 'knee_flexion_standing')
on conflict (kind, code) do nothing;

insert into public.treatment_catalog_items (kind, code, name) values
  ('physical_agent', 'tens-ems', 'TENS/EMS'),
  ('physical_agent', 'therapeutic-ultrasound', 'Ultrasonido terapéutico'),
  ('physical_agent', 'infrared-light', 'Luz infrarroja'),
  ('physical_agent', 'moist-heat-pack', 'Compresas húmedo-calientes'),
  ('physical_agent', 'cryotherapy', 'Crioterapia'),
  ('physical_agent', 'laser', 'Láser')
on conflict (kind, code) do nothing;

alter table public.clinical_audit_logs
  drop constraint clinical_audit_logs_entity_type_check;
alter table public.clinical_audit_logs
  add constraint clinical_audit_logs_entity_type_check
  check (entity_type in (
    'patient',
    'clinical_evaluation',
    'treatment_intervention',
    'rom_measurement',
    'treatment_catalog_item'
  ));

create or replace function public.capture_treatment_catalog_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_data jsonb;
  v_new_data jsonb;
  v_record jsonb;
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

  insert into public.clinical_audit_logs (
    entity_type,
    record_id,
    action,
    actor_id,
    old_data,
    new_data
  ) values (
    'treatment_catalog_item',
    (v_record ->> 'id')::uuid,
    tg_op,
    (select auth.uid()),
    v_old_data,
    v_new_data
  );
  return null;
end;
$$;

revoke all on function public.capture_treatment_catalog_audit_log() from public, anon, authenticated;

create trigger treatment_catalog_clinical_audit_log
  after insert or update or delete on public.treatment_catalog_items
  for each row execute function public.capture_treatment_catalog_audit_log();
