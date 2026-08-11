Song Shout — Supabase migrations live here.

Workflow
--------
- Local:  `npx supabase start` then `npx supabase db reset`
- Remote: `npx supabase db push`

Migration naming: `<timestamp>_<name>.sql` (Supabase CLI generates with
`npx supabase migration new <name>`).

Order
-----
0001_profiles.sql           — profiles table + auth.users trigger + helpers
0002_social.sql             — friend_requests + friendships
0003_songs.sql              — song_references
0004_shouts.sql             — shouts (+ reply link)
0005_reactions.sql          — reactions
0006_notifications.sql      — notifications
0007_rls.sql                — RLS enablement + policies (all tables)