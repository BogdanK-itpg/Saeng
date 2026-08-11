-- Reactions: one emoji reaction per user per shout.

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  shout_id uuid not null references public.shouts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reaction_type text not null,
  created_at timestamptz not null default now(),

  constraint reactions_type_length check (char_length(reaction_type) between 1 and 32)
);

-- First reaction type wins for a user on a given shout coercion; second
-- insertion for the same (shout, user) is rejected. Use upsert to change it.
create unique index reactions_user_shout_key on public.reactions (shout_id, user_id);