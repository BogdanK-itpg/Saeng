-- Profiles: application-level user data, linked 1:1 to Supabase Auth identity.
-- Passwords live in auth.users (Supabase Auth); they are never stored here.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_username_format check (
    username ~ '^[a-z0-9_]{3,20}$'
  ),
  constraint profiles_display_name_length check (
    char_length(display_name) between 1 and 50
  )
);

create unique index profiles_username_key on public.profiles (username);

-- Autofill updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- On signup, create the profile row. Initially username/display name come from
-- OAuth metadata (or defaults); email/password users finalize the username
-- during onboarding.
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
    coalesce(raw_username, 'u' || replace(gen_random_uuid()::text, '-', '')),
    left(default_display, 50)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();