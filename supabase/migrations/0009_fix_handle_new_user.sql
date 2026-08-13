-- Fix handle_new_user: the fallback username generated a 33-char string
-- ('u' + full uuid) that violated the profiles_username_format check
-- (^[a-z0-9_]{3,20}$), so signups without username metadata failed.
-- Recreated here via create-or-replace; 0001_profiles.sql is updated to the
-- same definition for fresh installs.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_username text;
  default_display text;
begin
  raw_username := lower(nullif(trim(new.raw_user_meta_data ->> 'username'), ''));
  default_display := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');
  if default_display is null then
    default_display := split_part(new.email, '@', 1);
  end if;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(raw_username, 'u' || left(replace(gen_random_uuid()::text, '-', ''), 12)),
    left(default_display, 50)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;