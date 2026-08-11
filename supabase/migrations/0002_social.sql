-- Social: friend_requests + friendships.

-- ---------------------------------------------------------------------------
-- Helper: are two users friends?
-- ---------------------------------------------------------------------------
create or replace function public.is_friend(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.friendships
    where user_id = a and friend_id = b
  );
$$;

-- ---------------------------------------------------------------------------
-- friend_requests
-- ---------------------------------------------------------------------------
create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    constraint friend_requests_status_check
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),

  constraint friend_requests_no_self
    check (sender_id <> receiver_id)
);

-- One request per directed pair at a time.
create unique index friend_requests_directed_key
  on public.friend_requests (sender_id, receiver_id);

-- No two pending requests between the same pair in either direction.
create unique index friend_requests_pending_pair_key
  on public.friend_requests (least(sender_id, receiver_id), greatest(sender_id, receiver_id))
  where status = 'pending';

create index friend_requests_receiver_idx
  on public.friend_requests (receiver_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- friendships
-- ---------------------------------------------------------------------------
-- Canonical storage: always store the lexicographically smaller id as user_id.
-- This gives a single row per friendship pair and a hard uniqueness guarantee.
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint friendships_no_self check (user_id <> friend_id),
  constraint friendships_canonical_order check (user_id < friend_id)
);

create unique index friendships_pair_key on public.friendships (user_id, friend_id);

create index friendships_friend_idx on public.friendships (friend_id);