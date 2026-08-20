-- Phase 13 hardening: RLS policies decide WHICH rows a client may touch, but
-- they cannot restrict WHICH columns change. These triggers make application
-- data truly immutable and narrow every client update to its intended field.

-- 1. Shouts are immutable except seen_at, and only the recipient may update.
create or replace function public.shouts_guard_update()
returns trigger as $$
begin
  if old.sender_id is distinct from new.sender_id
     or old.receiver_id is distinct from new.receiver_id
     or old.song_reference_id is distinct from new.song_reference_id
     or old.message is distinct from new.message
     or old.reply_to_shout_id is distinct from new.reply_to_shout_id then
    raise exception 'Shout content is immutable.';
  end if;
  if auth.uid() is distinct from old.receiver_id then
    raise exception 'Only the shout recipient may update a shout.';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists shouts_guard_update on public.shouts;
create trigger shouts_guard_update
  before update on public.shouts
  for each row execute function public.shouts_guard_update();

-- 2. A reaction can never move to a different shout or owner.
create or replace function public.reactions_guard_update()
returns trigger as $$
begin
  if old.shout_id is distinct from new.shout_id
     or old.user_id is distinct from new.user_id then
    raise exception 'A reaction cannot change its shout or owner.';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists reactions_guard_update on public.reactions;
create trigger reactions_guard_update
  before update on public.reactions
  for each row execute function public.reactions_guard_update();

-- 3. Notifications: only read_at may change.
create or replace function public.notifications_guard_update()
returns trigger as $$
begin
  if old.user_id is distinct from new.user_id
     or old.type is distinct from new.type
     or old.actor_id is distinct from new.actor_id
     or old.related_entity_id is distinct from new.related_entity_id then
    raise exception 'Notification content is immutable; only read_at may change.';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists notifications_guard_update on public.notifications;
create trigger notifications_guard_update
  before update on public.notifications
  for each row execute function public.notifications_guard_update();

-- 4. Avatar uploads: restrict to image MIME types and a 5 MB cap at the
--    storage layer (defense in depth; the app also validates server-side).
drop policy if exists "avatars_insert_own_folder" on storage.objects;
create policy "avatars_insert_own_folder"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (metadata ->> 'mimetype') in ('image/jpeg', 'image/png', 'image/webp')
    and (metadata ->> 'size')::bigint <= 5242880
  );