-- Shouts: the core interaction. A shout is a song reference sent to a friend.

create table public.shouts (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  song_reference_id uuid not null references public.song_references (id),
  message text,
  sent_at timestamptz not null default now(),
  seen_at timestamptz,
  reply_to_shout_id uuid references public.shouts (id) on delete set null,

  constraint shouts_no_self check (sender_id <> receiver_id),
  constraint shouts_message_length check (message is null or char_length(message) <= 280)
);

create index shouts_receiver_idx on public.shouts (receiver_id, sent_at desc);
create index shouts_sender_idx on public.shouts (sender_id, sent_at desc);