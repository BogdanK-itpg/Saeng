# Song Shout

A social web app where friends communicate by sending each other songs instead
of (or alongside) text. Pick a friend → search for a song → send a **Shout**.
The app is *not* a music streaming platform — it stores song metadata + provider
references and plays provider-hosted previews only.

Built as a portfolio project with a strong focus on clean architecture,
provider abstraction, and server-side security (Supabase RLS).

## Tech stack

- **Frontend:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4
- **Backend:** Supabase (Auth, PostgreSQL, Storage for avatars, Realtime)
- **Music:** provider abstraction layer; **iTunes Search API** is the active
  provider (no credentials). Spotify is a drop-in later.

## Getting started

### Prerequisites

- Node.js 20+
- A Supabase project (or `supabase` CLI for local dev)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values:

| Variable | Where to get it | Public? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | ✅ safe for browser |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API (new-style `sb_publishable_…` key) | ✅ safe for browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (`service_role`) | ❌ server-only — never expose |
| `NEXT_PUBLIC_APP_URL` | Your app URL, e.g. `http://localhost:3000` | ✅ safe for browser |

> Spotify credentials are **not** required — the active music provider is the
> public iTunes Search API.

### 3. Apply database migrations

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Migrations live in `supabase/migrations/` and create: `profiles`,
`friend_requests`, `friendships`, `song_references`, `shouts`, `reactions`,
`notifications`, plus RLS policies, the avatars storage bucket, and the
`auth.users → profiles` trigger.

### 4. Required Supabase settings

- **Authentication → Providers → Email → "Confirm email" must be OFF.** Auth is
  username-based and no confirmation email is sent; with it ON, signup never
  returns a session.

### 5. Run

```bash
npm run dev        # http://localhost:3000
```

## Authentication model

Login and registration use **username + password only** (display name is shown
to other users; username is unique and used for searching).

Supabase Auth requires an email internally, so each username maps to a
deterministic **synthetic internal email** `<username>@songshout.local`
(see `src/lib/auth/username-email.ts`). Users never see or type this address;
it keeps sessions, `auth.uid()` RLS, and Supabase Auth as the password
authority. Username uniqueness is enforced by a server pre-check plus a DB
unique index.

Email sending is **disabled** (the `resend` client is not wired up; the
forgot/reset-password server action exists but is not connected to any form).
"Confirm email" is off, so no confirmation email is used.

## Commands

```bash
npm run dev        # local dev server
npm run lint       # eslint
npm run test       # vitest unit tests
npx tsc --noEmit   # typecheck
npm run build      # production build
npx supabase db push   # apply migrations
```

## Deployment

See [`docs/deployment.md`](docs/deployment.md) for the full Vercel + Supabase
production setup (environment variables, URL configuration, and the
post-deploy verification checklist).

## Project structure

```
src/
  app/
    (auth)/          # login / register
    (app)/           # authenticated pages: dashboard, friends, send, profile, shouts/[id]
    actions/         # server actions (auth, profile, friends, shouts)
    api/songs/search # authenticated song-search route
    auth/            # auth callbacks
  components/        # auth, friends, shouts, songs, profile, ui primitives
  lib/               # supabase clients, music providers, auth helpers, validation
  services/          # domain services (friends, shouts, notifications, reactions, profiles)
  types/             # domain types
  proxy.ts           # Next 16 middleware (session refresh + route guards)
supabase/migrations/ # PostgreSQL schema + RLS
docs/                # idea.md (spec), WORKPLAN.md, development-plan.md, PROGRESS.md
```

## Documentation

- `docs/idea.md` — product specification
- `docs/WORKPLAN.md` — master development process & phases
- `docs/development-plan.md` — full implementation plan
- `docs/PROGRESS.md` — what is done, verified, and what's next