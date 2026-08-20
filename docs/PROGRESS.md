# Song Shout — Progress & Handoff

Last updated: 2026-08-20

This file records what has been built, what has been verified, and exactly where
the next developer/session should continue. The source of truth for the product
is `docs/idea.md`; the master process is `docs/WORKPLAN.md`; the full plan is
`docs/development-plan.md`.

---

## Recent change — Settings page + ambient glow (2026-08-20)

Added a `/settings` page with device-local customization, plus an LED-strip
glow around the audio player while a preview plays.

- **Settings** (`src/app/(app)/settings/`, `src/components/settings/`):
  - `SettingsProvider` (client context) persists preferences to
    `localStorage` under `songshout.settings`: **theme** (System/Light/Dark),
    **ambient glow** on/off, **glow intensity** (Subtle/Medium/Vivid).
  - Theme is class-based dark mode: `@custom-variant dark` in `globals.css`
    + an inline FOUC-prevention script in the root layout. `dark:` variants
    follow `.dark` on `<html>`, not just `prefers-color-scheme`.
  - Nav link added; `/settings` added to the proxy's protected prefixes.
- **Ambient glow** (`src/components/ui/audio-player.tsx`):
  - `AudioPlayer` accepts `artworkUrl`; while playing (and glow enabled) it
    wraps itself in an animated `conic-gradient` ring whose colors are sampled
    from the album cover — the ring rotates like an LED strip (`--glow-angle`
    + `glow-spin` keyframes in `globals.css`). Ring thickness/speed scale with
    intensity.
  - Color sampling (`src/lib/colors.ts`) draws a 64px canvas read and
    quantizes to the 4 most frequent colors. The provider CDN sends no CORS
    headers, so covers are fetched through the new authenticated
    `src/app/api/artwork/route.ts` (server-side proxy, host allowlist
    `.mzstatic.com` / `itunes.apple.com`, never audio — spec-compliant).
- Verified: `npm run lint` ✅ · `npx tsc --noEmit` ✅ · `npm run build` ✅
  (adds ƒ `/api/artwork` and ƒ `/settings`); live: `/api/artwork` → **401**
  unauthenticated, `/settings` → **307** to `/login`; real artwork proxies
  with 200 + valid JPEG; allowlist rejects look-alike hosts.
- Caveat: preferences are per-device (localStorage), not synced per-account —
  intentional for V1.

---

## Recent change — username-based auth + email sending disabled (2026-08-20)

Auth is now **username + password** only (no email field anywhere in the UI).

- **Login/register** take `username`, `display name`, and `password`.
- Supabase Auth still requires an email under the hood, so each username maps to
  a **synthetic internal email** `<username>@songshout.local`, derived
  deterministically by `authEmailForUsername()` in
  `src/lib/auth/username-email.ts`. Users never see or type it. This keeps
  sessions, `auth.uid()` RLS, and Supabase Auth as the password authority.
- **Username uniqueness** is enforced two ways: a pre-check in
  `registerAction` (admin client, friendly "already taken" error) and the DB
  `profiles_username_key` unique index (backstop).
- **Email sending is commented out for future development**:
  - `src/lib/resend.ts` — entire file commented (the `resend` package stays in
    `package.json` so it type-checks when restored).
  - `forgotPasswordAction` (auth.ts), forgot-password + reset-password pages and
    forms commented out; `/forgot-password` and `/auth/reset-password` now
    render `notFound()`.
  - `RESEND_API_KEY` commented out in `.env.example`; "Contact email" section
    on the profile page commented out.
- `proxy.ts` `AUTH_PAGES` no longer includes `/forgot-password`.

**Required manual step (done on the dashboard):** Supabase **Authentication →
Providers → Email → "Confirm email" must be OFF** — otherwise signup never
returns a session and the synthetic accounts can never be confirmed. Verified
live: signUp returns a session, the profile trigger fires, login by username
works, duplicate-username pre-check works.

**Caveat:** existing accounts created with real emails (e.g. the old
`alice6`/`bob6` test users) can no longer log in by username — re-register them
through the new flow.

---

## Phase checklist

```
[x] Phase 0  — Analysis & architecture (docs/development-plan.md created)
[x] Phase 1  — Next.js + Supabase initialization (scaffolded, committed)
[x] Phase 2  — Database & domain foundation (migrations applied + verified)
[x] Phase 3  — Authentication & user profiles (username-based auth; register/login verified live)
[x] Phase 4  — Friend system (code done, live two-user browser test pending)
[x] Phase 5  — Music provider (iTunes provider live; Spotify deferred)
[x] Phase 6  — Send Shout (action + composer + /send page)
[x] Phase 7  — Shout view & playback (detail page + audio player + dashboard feed)
[-] Phase 8  — Notifications (deferred by project owner 2026-08-20; DB rows exist, UI not built)
[x] Phase 9  — Reactions (add/change/remove on shout detail, RLS-verified live)
[ ] Phase 10 — Dashboard
[ ] Phase 11 — Main application pages
[~] Phase 12 — UX/accessibility/responsiveness (settings + ambient glow landed 2026-08-20; full UX pass pending)
[ ] Phase 13 — Security review
[ ] Phase 14 — Testing
[ ] Phase 15 — Deployment
```

Legend: `[x]` done · `[~]` in progress / partially done · `[ ]` not started

---

## What is done and how to verify

### Phase 1 — Initialization (committed `2ac799c`)

Next.js 16.3 app (App Router, TypeScript, Tailwind v4, ESLint, `src/`, `@/*` alias).

- Supabase SSR integration:
  - `src/lib/supabase/env.ts` — resolves public URL + key (accepts either
    `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  - `src/lib/supabase/client.ts` — browser client (public env vars)
  - `src/lib/supabase/server.ts` — cookie-based server client (async `cookies()`)
  - `src/lib/supabase/proxy.ts` — session refresh helper
  - `src/lib/supabase/admin.ts` — **server-only** service-role client (throws if key missing)
  - `src/proxy.ts` — Next 16 proxy (renamed from `middleware`); guards `/dashboard`,
    `/friends`, `/send`, `/shouts`, `/notifications`, `/profile`; redirects signed-in
    users away from `/login`, `/register`
- `.env.example` (git-ignored real values live in `.env.local`)
- `supabase/config.toml`, `supabase/migrations/README.md`

Verify: `npm run build` shows `ƒ Proxy (Middleware)`.

### Phase 2 — Database & domain (committed `77c0c0d`, applied + fixed 2026-08-13)

Migrations in `supabase/migrations/` (all applied to project `socrwlpwacahxioyboiv`):

| File | Contents |
| --- | --- |
| `0001_profiles.sql` | profiles table, `auth.users` trigger, `set_updated_at()` |
| `0002_social.sql` | friend_requests + friendships + `is_friend()` (fixed: function now created **after** friendships table) |
| `0003_songs.sql` | song_references |
| `0004_shouts.sql` | shouts (+ `reply_to_shout_id`) |
| `0005_reactions.sql` | reactions (unique `shout_id,user_id`) |
| `0006_notifications.sql` | notifications |
| `0007_rls.sql` | RLS enabled + policies on all tables |
| `0008_avatar_storage.sql` | avatars bucket + path policies |
| `0009_fix_handle_new_user.sql` | replaces `handle_new_user` fallback username (was 33 chars, violated the 20-char check) |
| `0010_friend_requests_directed_key.sql` | drops unconditional `friend_requests_directed_key` index so a sender can re-request after a decline / friendship removal |

Verified on the remote database:

- 7 tables, RLS enabled on all (`rowsecurity = true`).
- `auth.users` AFTER INSERT trigger `on_auth_user_created` enabled.
- Functions `handle_new_user`, `is_friend`, `set_updated_at` present.
- 19 RLS policies across `public` tables + 4 `avatars` storage policies + public bucket.
- 10 migrations recorded in remote migration history (`supabase migration list`).

Notes on applied fixes:

- `0002_social.sql` originally created `is_friend()` before the `friendships`
  table existed, so the fresh install failed with
  `relation "public.friendships" does not exist`. The helper is now defined at
  the end of the file, after the table. (0001 had already applied before the
  failure; re-pushing applied 0002–0008 cleanly.)
- `0001_profiles.sql`: the signup-trigger fallback username was
  `'u' || full-uuid` (33 chars) which violates the `^[a-z0-9_]{3,20}$` check
  constraint, so any signup without username metadata would fail. Fixed to
  `'u' || left(uuid, 12)` (13 chars) in both 0001 (fresh installs) and 0009
  (already-applied remote DB, via `create or replace`).
- `0002_social.sql`: `friend_requests_directed_key` was an unconditional unique
  index on `(sender_id, receiver_id)`, permanently blocking a new request to
  the same directed pair once any request existed (declined, or accepted then
  friendship removed). Removed from 0002 and dropped on the remote via 0010;
  uniqueness for pending requests is kept via `friend_requests_pending_pair_key`.

Domain code:

- `src/types/domain.ts` — all entities + joined view types
- `src/lib/errors.ts` — classified errors (`user` / `provider` / `infrastructure`)
- `src/services/` — `_row-mappers.ts`, `friends.ts`, `shouts.ts`,
  `notifications.ts`, `reactions.ts`, `profiles.ts`
- `src/lib/auth/current-user.ts` — `getCurrentUser()` / `requireUser()`

### Phase 3 — Authentication & profiles (done; register/login verified live 2026-08-20)

- `src/lib/validation/schemas.ts` — zod schemas (register, login, profile, shout
  message, reaction)
- `src/app/actions/auth.ts` — register, login, sign out (server actions)
- `src/app/actions/profile.ts` — update profile, set avatar
- Auth UI: `src/app/(auth)/` login / register pages + forms;
  `src/app/auth/callback/route.ts`
- Auth is **username + password** based: usernames map to a synthetic internal
  email `<username>@songshout.local` (`src/lib/auth/username-email.ts`) because
  Supabase Auth requires an email. See the "Recent change" section above.
- Email-driven flows (forgot/reset password, Resend) are commented out for
  future development; `/forgot-password` and `/auth/reset-password` render 404.
- `src/app/(app)/layout.tsx` — authenticated shell with nav + avatar + sign-out
- `src/app/(app)/profile/page.tsx` — profile edit + avatar upload
- `src/app/(app)/dashboard/page.tsx` — received shouts + send action (Phase 7)
- Landing page (`src/app/page.tsx`) — real marketing landing with login/register
  CTAs + feature cards (replaces the create-next-app boilerplate)
- UI primitives: `src/components/ui/` (button, input, label, alert, spinner);
  `src/utils/cn.ts`
- `public/avatar-placeholder.svg`

### Phase 4 — Friend system (code done; live two-user test pending)

Server actions: `src/app/actions/friends.ts`

- `sendFriendRequestAction` — validates the receiver, blocks self-requests,
  existing friends, and duplicate requests.
- `acceptFriendRequestAction` / `declineFriendRequestAction` — receiver-only,
  verified against the stored request before writing (admin client creates the
  canonical friendship row).
- `withdrawFriendRequestAction` — sender-only withdrawal of a pending request.
- `removeFriendAction` — removes either direction of a friendship.

Services: `src/services/friends.ts` additions

- `getRelationship(userId, otherId)` — `self | friend | outgoing | incoming | none`.
- `listIncomingRequests` / `listOutgoingRequests` — pending requests joined with
  the counterpart profile.
- `searchProfilesWithRelationship` — username search annotated with relationship.
- `withdrawFriendRequest`.

UI / page

- `src/app/(app)/friends/page.tsx` — search, incoming/outgoing request lists,
  friends list.
- `src/components/friends/` — `FriendSearch` (debounced `?q=`), `UserResultCard`
  (send request / status badge), `IncomingRequestCard` (accept/decline),
  `OutgoingRequestCard` (withdraw), `FriendCard` (remove), `ProfileAvatar`.

Verified

- `npm run lint` ✅ · `npx tsc --noEmit` ✅ · `npm run build` ✅ (adds ƒ `/friends`)
- Dev-server smoke test: `/` → 200, `/login` → 200, `/friends` unauthenticated → 307
  redirect to `/login`. Proxy guards work.
- Migration `0010` applied to remote (index dropped, verified via `pg_indexes`).
- Live two-user friend flow (register → request → accept → list) still requires
  `SUPABASE_SERVICE_ROLE_KEY` (accept uses the admin client) — see next steps.

### Phase 5 — Music provider (iTunes, live; Spotify deferred)

Decision: after Spotify's Feb 2026 change requiring Premium for the Web API,
the initial provider is the **public iTunes Search API** — no credentials,
account, or subscription required. The `MusicProvider` abstraction keeps the
rest of the app provider-agnostic; Spotify remains a drop-in later.

Provider abstraction:

- `src/lib/music/types.ts` — `SongResult`, `MusicProvider`, `ProviderError`.
- `src/lib/music/registry.ts` — `getProvider(id)`; `itunes` registered.
- `src/lib/music/itunes/http.ts` — `searchItunes()` (GET `/search`,
  `media=music`, `entity=song`, 10s timeout).
- `src/lib/music/itunes/mapper.ts` — normalizes tracks → `SongResult`
  (`artworkUrl100` → `300x300bb`; `trackTimeMillis` ms → seconds).
- `src/lib/music/itunes/provider.ts` — `ItunesProvider` implements
  `searchSongs()` + `getSong()` (via `/lookup`).

Route:

- `src/app/api/songs/search/route.ts` — authenticated (`getCurrentUser` → 401
  when signed out), validates `q` (≤100 chars) + `provider` id, returns
  `{ results: SongResult[] }`. Server-only; no credentials reach the browser.

Types:

- `ProviderId` in `src/types/domain.ts` widened to `"itunes" | "spotify"`.

Verified

- `npm run lint` ✅ · `npx tsc --noEmit` ✅ · `npm run build` ✅ (adds ƒ `/api/songs/search`)
- Live provider test (`tsx` against real API): `searchSongs("Dreams Fleetwood Mac")`
  returns normalized results with title/artist/album, 300px art, `previewUrl`,
  `externalUrl`, `duration` — verified above.
- Route auth guard: unauthenticated `/api/songs/search?q=…` → **401**.

### Phase 6 — Send Shout (done; composer UI live-tested via build)

Leveraged the Phase 5 provider + existing Phase 6 service layer
(`sendShout` in `src/services/shouts.ts` already wrote song_ref + shout +
notification). Added the application pieces:

- `src/app/actions/shouts.ts` — `sendShoutAction`: re-validates the full song
  payload server-side with zod (`songSchema` + `sendShoutSchema`), requires a
  friend `receiverId`, message ≤280 chars. Friend check happens in the service
  using the admin client.
- `src/app/(app)/send/page.tsx` — server component loads `listFriends`, renders
  the composer.
- `src/components/shouts/send-shout-composer.tsx` — friend `<select>`, song
  search, optional message; `useActionState` for pending + error/success states;
  hidden `song` field carries the selected `SongResult` as JSON.
- `src/components/songs/song-search.tsx` — client component hitting
  `/api/songs/search` (Enter / button), shows results, loading spinner, empty +
  error states.
- `src/components/songs/song-result-card.tsx` / `selected-song.tsx` — result
  row with artwork + "Select"; the picked song shown with a "Change" button.

Verified

- `npm run lint` ✅ · `npx tsc --noEmit` ✅ · `npm run build` ✅ (adds ƒ `/send`)
- Live DB write-path test (service-role admin client against remote): created
  two users (profile trigger fired), verified the friend check query returns
  null before adding the friendship, inserted the friendship, upserted the song
  reference (conflict key `provider,provider_song_id` honored), inserted a
  shout + recipient notification — all OK.

### Phase 7 — Shout view & playback

Built the receiving side of shouts:

- `src/app/(app)/shouts/[id]/page.tsx` — server component detail page. Loads
  via `getShoutWithDetails`, `notFound()` when the user isn't a participant,
  `markShoutSeen` fired when the recipient opens it. Shows sender/recipient,
  message, song metadata + artwork, and the audio player.
- `src/components/ui/audio-player.tsx` — client component that streams the
  provider `previewUrl` directly from the CDN (no proxying). Play **triangle**
  button (▶/⏸), a **seekable progress bar** that fills by
  `currentTime / duration`, and elapsed/total time labels. Duration is read
  robustly from `loadedmetadata` / `durationchange` / `timeupdate` (iTunes
  `.m4a` previews often only report it after the first play tick). Only one
  player plays at a time per page (`window` `player:play` event pauses the
  others). No preview → "Listen on the web" fallback link; playback failure →
  inline error + external-link icon.
- `src/app/(app)/dashboard/page.tsx` — "Received" section listing recent
  shouts with **inline preview playback** (no need to open the shout) + a Send
  Shout button. The song info still links to the detail page.
- `src/components/shouts/shout-card.tsx` — `ReceivedShoutCard` embeds the
  `AudioPlayer` below the song/sender row so previews play right from the list;
  the artwork + title + sender block links to `/shouts/[id]`.
- `src/services/shouts.ts` — added `getShoutWithDetails` and
  `listReceivedShoutsWithDetails` (song + sender/receiver joins).

Important bug found & fixed (live-tested):

- PostgREST returns embedded to-one FK joins as **objects**, not arrays. The
  existing `friends.ts` / `notifications.ts` mappers used `[0]` index access
  (based on an earlier assumption), which would have crashed at runtime once
  the friend/notification flows were exercised. Fixed all three services to
  use the joined object directly (with an `as unknown as` cast since the
  untyped query builder infers arrays). Verified the object shape + mapping
  against the live DB.

Verified

- `npm run lint` ✅ · `npx tsc --noEmit` ✅ · `npm run build` ✅ (adds ƒ `/shouts/[id]`)
- Live query-mapping test: fetched the shout details join and confirmed
  `song`/`sender`/`receiver` come back as objects; the mapper produced the
  expected `ShoutWithDetails`.

### Phase 9 — Reactions (done 2026-08-20)

One emoji reaction per shout, added/changed/removed by the **recipient**; the
sender sees it read-only. Uniqueness is enforced by the DB unique index on
`(shout_id, user_id)` and RLS only lets the recipient insert.

- `src/app/actions/reactions.ts` — `setReactionAction` / `removeReactionAction`
  (server actions, zod-validated shout id + reaction type, revalidate the shout
  route).
- `src/services/reactions.ts` — added `listReactionsWithActors` (reactions
  joined with the reactor profile via `profiles!reactions_user_id_fkey`;
  PostgREST to-one join mapped as an object, per the Phase 7 finding).
- `src/components/shouts/reaction-bar.tsx` — client component: recipient gets an
  emoji picker (❤️ 🎶 🔥 👏 😂 🥳) with toggle-to-remove via `useTransition` +
  `router.refresh()`; sender gets a read-only list (avatar + "X reacted with Y").
- `src/app/(app)/shouts/[id]/page.tsx` — fetches `listReactionsWithActors`,
  derives the user's own reaction, renders `ReactionBar`.
- `src/types/domain.ts` — added `ReactionWithActor`.

Verified (live against remote, temp users cleaned up):

- Recipient add ✅, change via upsert ✅ (stored type updated), remove ✅.
- **Sender insert blocked by RLS** (`new row violates row-level security policy`) ✅.
- `npm run lint` ✅ · `npx tsc --noEmit` ✅ · `npm run build` ✅.

Note: reaction notifications (type `reaction` already in the DB schema) are not
created yet — Phase 8 is deferred, so there's no notifications UI to surface
them.

---

## Verification status

| Check | Status |
| --- | --- |
| `npm run lint` | ✅ passes |
| `npx tsc --noEmit` | ✅ passes |
| `npm run build` | ✅ passes |
| Migrations applied to Supabase | ✅ all 10 on `socrwlpwacahxioyboiv` (2026-08-13) |
| Auth register/login flow tested live | ✅ username-based: signup returns a session (confirm-email OFF), profile trigger fires, login by username works, duplicate username blocked (2026-08-20) |
| Friend system smoke test (routes/proxy) | ✅ unauthenticated `/friends` → 307; build passes |
| Music provider (iTunes) live search | ✅ normalized results from real API; route 401 when unauthenticated |
| Send Shout DB write-path | ✅ friendship check → song upsert → shout insert → notification insert, all verified against remote |
| Shout detail join shape | ✅ embedded to-one joins are objects (not arrays); fixed + mapped live |
| AudioPlayer + inline dashboard playback | ✅ play triangle + seek bar + live duration; card plays preview without opening the shout |
| Reactions (Phase 9) | ✅ recipient add/change/remove works; sender blocked by RLS; lint/tsc/build pass (2026-08-20) |

---

## Where I left off — the next steps

### 1. `.env.local` is complete

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` — **set + validated** (REST call returned 200)
- ✅ Spotify credentials **not required** — active provider is the public
  iTunes Search API (no keys). Either remove the leftover Spotify env vars or
  leave them empty; they'd only be needed to add Spotify as a second provider
  later.

### 2. Verify Phase 3 + Phase 4 live (browser)

The backend is in place and the DB write-paths were exercised via the admin
client, but a full two-user browser pass is still useful.

NOTE (2026-08-20): with username-based auth, the old `alice6`/`bob6` accounts
(created with real emails) can no longer log in by username. Re-register two
fresh users through `/register` (username + display name + password), create a
friendship via `/friends`, then run the flows below. Steps:

- `npm run dev`
- Log in as both users (two browsers / incognito windows)
- Confirm profile rows exist for both (`0001` trigger)
- Log out / log back in — session persists across refresh
- Visit `/profile` — edit display name / username, upload avatar
- Visit `/dashboard` as logged-out user → redirect to `/login`
- Check unauthenticated access to `/login` → redirects away when logged in
- **Friend flow (user A + user B) — also test the request path:**
  - A searches B by username → send request
  - B sees it under "Incoming requests" → accepts
  - Both see each other under "Your friends"
  - Edge cases: self-search (shown as "This is you"), duplicate request blocked,
    existing friend re-request blocked, withdraw works, remove friend works and
    both can re-request afterwards (index dropped in 0010)
- **Send Shout flow (user A + user B):**
  - A visits `/send`, picks B from the friend list
  - A searches a song in the composer, selects a result (artwork shows)
  - A writes a message, submits → success alert
  - Verify in Supabase: `song_references` (1 row), `shouts` (1 row),
    `notifications` (1 row for B)
- **Shout view flow:**
  - B opens the shout from `/dashboard` → detail page shows sender, message,
    artwork, audio player; `seen_at` is set on B's visit
  - B plays the preview inline on `/dashboard` (triangle + progress bar) and
    on the detail page (or uses the provider link fallback)
  - A (sender) can also open it; the "To" label renders instead of "From"

### 3. Next: Phase 10 — Dashboard (+ remaining pages)

Phase 8 (Notifications) is **deferred by the project owner** (2026-08-20) as low
priority — the DB rows and service queries exist but no UI.

The dashboard (`/dashboard`) already shows received shouts with inline playback
and a Send Shout button, so Phase 10 is mostly polish: quick-send affordance and
keeping it focused. Remaining work:

- Phase 10 — Dashboard: recent shouts + quick send (mostly present), polish
- Phase 11 — Pages: `/notifications` (deferred with Phase 8), profile statistics
- Phase 12 — UX/accessibility/responsiveness: `/settings` + ambient glow landed (2026-08-20); full pass pending
- Phase 13 — Security review
- Phase 14 — Testing
- Phase 15 — Deployment

Remaining smaller gaps (deferred):

- **Email delivery — fully disabled (2026-08-20).** Auth is username-based and
  the synthetic accounts have no real inbox, so no confirmation/reset email can
  be sent. "Confirm email" is OFF in the Supabase dashboard. All app-level email
  code (`src/lib/resend.ts`, forgot/reset-password flows) is commented out for
  future development. The earlier Brevo SMTP plan (2026-08-13) is archived — if
  email is ever re-enabled, restore those steps; otherwise simply drop the
  `resend` package + helper + env vars if app-sent emails aren't wanted.
- Avatar upload deletes are not wired to remove the old object (new uploads just
  add a new file). Acceptable for V1.
- Playing the "most popular" segment of a song is not possible with the iTunes
  provider: the `previewUrl` is a fixed ~30s clip chosen by Apple (already the
  hook/chorus); we never store full tracks, and segment-level control would
  need a provider like Spotify (deferred — Premium required).

---

## Commands

```bash
npm run dev        # local dev server (http://localhost:3000)
npm run lint       # eslint
npx tsc --noEmit   # typecheck
npm run build      # production build
npx supabase db push        # apply migrations (requires linked project + login)
npx supabase link --project-ref socrwlpwacahxioyboiv   # link remote
```

## Notes / gotchas already learned

- **Next.js 16**: `middleware.ts` is renamed `proxy.ts` (export `proxy`). Always read
  `node_modules/next/dist/docs/` before relying on Next APIs. `SearchParams` is **not**
  exported from `next` — use the inline
  `Promise<{ [key: string]: string | string[] | undefined }>` type.
- Supabase embedded FK joins return **objects for to-one FKs** (e.g.
  `shouts.sender_id → profiles`), not arrays. Only to-many joins come back as
  arrays. Verified live against PostgREST during Phase 7. The untyped query
  builder types embedded resources as arrays, so cast via
  `data as unknown as ShoutDetailRow` before mapping.
- iTunes `.m4a` previews often report `audio.duration` **only after the first
  play tick**, not on `loadedmetadata` — read duration from
  `loadedmetadata` / `durationchange` / `timeupdate` and treat
  `!isFinite(d) || d <= 0` as unknown to avoid showing `0:00`.
- Multiple audio players on one page: use a `window` custom event
  (`player:play` with the playing element as `detail`) so starting one pauses
  the others.
- The service-role key must never be imported from client code.
- Windows PowerShell blocks `.ps1`; use `npm.cmd` / `npx.cmd` in this shell.
- Supabase now issues `sb_publishable_…` keys; the app accepts both
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- A migration I thought failed half-way actually fails **atomically** (0002 failed,
  nothing after it applied; only 0001 was recorded). Fix the SQL, then re-push.
- Migration ordering bug (function before table) and signup fallback-length bug were
  fixed during DB setup — see Phase 2 notes above.
- `FriendSearch` debounces writes to the `?q=` search param; results render as a
  Server Component so the paged reload keeps search/request state consistent after
  server actions `revalidatePath("/friends")`.
- Supabase Auth requires an **email** for `signUp`/`signInWithPassword`, but the
  app is username-based — usernames map deterministically to
  `<username>@songshout.local` (`authEmailForUsername`). Keep this derivation in
  one place; never show it in the UI. "Confirm email" must stay OFF, or signup
  never returns a session.
- Line endings splash: Windows git warns about CRLF — harmless.