-- Row Level Security: enable on all user-owned tables and grant least-privilege
-- policies. These policies are the database backstop for every authorization
-- decision. Never rely on hiding buttons in the UI.

alter table public.profiles enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.song_references enable row level security;
alter table public.shouts enable row level security;
alter table public.reactions enable row level security;
alter table public.notifications enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- Anyone who is signed in can read profiles (needed for username search).
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- A user inserts their own initial profile row (trigger usually covers signup,
-- but keep the direct path safe and explicit).
create policy "profiles_insert_self"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- A user can only edit their own profile.
create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- No delete policy: profile deletion is out of V1 scope.

-- ---------------------------------------------------------------------------
-- friend_requests
-- ---------------------------------------------------------------------------
create policy "friend_requests_select_participant"
  on public.friend_requests for select
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

-- You can send a request if:
--  - you are the sender,
--  - you are not requesting yourself,
--  - the target profile exists,
--  - you are not already friends,
--  - there is no existing pending or active request between the pair.
create policy "friend_requests_insert_sender"
  on public.friend_requests for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and sender_id <> receiver_id
    and exists (select 1 from public.profiles p where p.id = receiver_id)
    and not public.is_friend(auth.uid(), receiver_id)
    and not exists (
      select 1 from public.friend_requests r
      where status = 'pending'
        and least(r.sender_id, r.receiver_id) = least(auth.uid(), receiver_id)
        and greatest(r.sender_id, r.receiver_id) = greatest(auth.uid(), receiver_id)
    )
  );

-- Only the receiver can accept or decline.
create policy "friend_requests_update_receiver"
  on public.friend_requests for update
  to authenticated
  using (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());

-- Only the sender can withdraw their own pending request.
create policy "friend_requests_delete_sender"
  on public.friend_requests for delete
  to authenticated
  using (sender_id = auth.uid() and status = 'pending');

-- ---------------------------------------------------------------------------
-- friendships
-- ---------------------------------------------------------------------------
create policy "friendships_select_participant"
  on public.friendships for select
  to authenticated
  using (user_id = auth.uid() or friend_id = auth.uid());

-- No client INSERT policy: friendships are created by the server when a
-- request is accepted (canonical ordering + mutual consent enforced there).
-- No client UPDATE policy: a friendship row has no mutable fields.
create policy "friendships_delete_participant"
  on public.friendships for delete
  to authenticated
  using (user_id = auth.uid() or friend_id = auth.uid());

-- ---------------------------------------------------------------------------
-- song_references
-- ---------------------------------------------------------------------------
-- Song references are non-sensitive metadata shared with any signed-in user.
create policy "song_references_select_authenticated"
  on public.song_references for select
  to authenticated
  using (true);

-- No INSERT/UPDATE/DELETE: references are created server-side via service role
-- when a song is selected, never directly by clients.

-- ---------------------------------------------------------------------------
-- shouts
-- ---------------------------------------------------------------------------
create policy "shouts_select_participant"
  on public.shouts for select
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

-- You can only shout to people you are friends with.
create policy "shouts_insert_sender"
  on public.shouts for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and sender_id <> receiver_id
    and public.is_friend(auth.uid(), receiver_id)
  );

-- Only the receiver marks a shout as seen.
create policy "shouts_update_receiver_seen"
  on public.shouts for update
  to authenticated
  using (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());

-- ---------------------------------------------------------------------------
-- reactions
-- ---------------------------------------------------------------------------
create policy "reactions_select_participant"
  on public.reactions for select
  to authenticated
  using (
    exists (
      select 1 from public.shouts s
      where s.id = shout_id
        and (s.sender_id = auth.uid() or s.receiver_id = auth.uid())
    )
  );

-- Only the shout recipient reacts (sender cannot react to their own shout).
create policy "reactions_insert_recipient"
  on public.reactions for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.shouts s
      where s.id = shout_id and s.receiver_id = auth.uid()
    )
  );

create policy "reactions_update_self"
  on public.reactions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "reactions_delete_self"
  on public.reactions for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create policy "notifications_select_owner"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

-- No client INSERT: notifications are created server-side via service role.
create policy "notifications_update_owner"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- No delete policy in V1: notification history is retained.