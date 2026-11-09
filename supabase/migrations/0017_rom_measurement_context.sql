alter table public.rom_measurements
  add column measurement_context text
    check (
      measurement_context is null
      or measurement_context in ('active', 'passive', 'post_treatment')
    );
