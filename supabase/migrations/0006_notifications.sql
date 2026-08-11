-- Notifications: persisted in-app notifications.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null
    constraint notifications_type_check
    check (type in ('friend_request', 'shout_received', 'reaction')),
  actor_id uuid references public.profiles (id) on delete set null,
  related_entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

create index notifications_user_idx
  on public.notifications (user_id, created_at desc);