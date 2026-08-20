-- Realtime: deliver newly inserted notifications to the owning client.
-- RLS (owner-only SELECT) gates which rows a subscriber can receive.
alter publication supabase_realtime add table public.notifications;