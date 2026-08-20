# Deployment guide

This app is designed to run on **Vercel** (Next.js) with **Supabase** as the
managed backend (Auth, PostgreSQL, Storage, Realtime). Everything below assumes
you have a Supabase project and a GitHub repo hosting this code.

## 1. Prerequisites

- Node.js 20+ and this repo checked out.
- A Supabase project (used for all development so far). The active music
  provider is the **public iTunes Search API** — no third-party music
  credentials are needed.
- A GitHub repo with the code pushed (`git push`).

## 2. Supabase configuration (production)

1. **Apply migrations** (already applied during development, but confirm):

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

2. **Authentication → Providers → Email → "Confirm email": OFF.** Auth is
   username-based; no confirmation email is sent. With it ON, signup never
   returns a session.

3. **Authentication → URL Configuration:**
   - Site URL: your production origin, e.g. `https://song-shout.vercel.app`
   - Redirect URLs must include:
     - `https://song-shout.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (for local dev)
     - `http://localhost:3000/**` and `https://song-shout.vercel.app/**` if you
       rely on wildcard redirects
   - The `auth/callback` route refreshes the session and redirects to `next`
     (defaults to `/dashboard`).

4. **Realtime:** the `notifications` table must be added to the
   `supabase_realtime` publication for the live badge to work:

   ```sql
   alter publication supabase_realtime add table public.notifications;
   ```
   (Migration `0011` already does this.)

5. **Storage:** the `avatars` bucket is created by a migration with an
   `insert` policy that only allows `image/jpeg|png|webp` and ≤ 5 MB. No manual
   bucket setup is required.

6. **Emails (optional, not used in the current UI):** the forgot/reset-password
   server action exists but is not wired to any form, and no confirmation email
   is sent. If you enable email flows later, configure an SMTP provider in
   Supabase Auth and add the reset redirect URL to the list above.

## 3. Vercel deployment

1. **Import the repo** into Vercel (Framework preset: Next.js). Build settings
   are auto-detected:
   - Build command: `npm run build`
   - Output directory: default

2. **Environment variables** — add these for the **Production** (and, if
   desired, Preview/Development) environments:

   | Variable | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | new-style `sb_publishable_…` key |
   | `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (**server-only, never client**; used by admin routes and avatar validation) |
   | `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

   Keys are available under Supabase → Project Settings → API. `NEXT_PUBLIC_*`
   values are inlined into the client bundle — only the publishable/anon-key
   class of keys may be exposed. **Never** prefix a real secret with
   `NEXT_PUBLIC_`.

3. Deploy. Vercel handles the production build; this repo also runs
   `npm run test` (Vitest) — wire it into CI/Preview if you like:

   ```yaml
   # .github/workflows/ci.yml
   jobs:
     ci:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: 20 }
         - run: npm ci
         - run: npm run lint
         - run: npx tsc --noEmit
         - run: npm run test
         - run: npm run build
   ```

## 4. Post-deploy verification checklist

- [ ] `https://<app>/` loads (landing page).
- [ ] `/register` creates an account (username + password); session persists.
- [ ] `/dashboard` after login shows Received/Sent sections and the
      notifications badge increments on a new shout (Realtime).
- [ ] `/friends` search + friend request + accept flow works end-to-end
      (use two browsers / an incognito window).
- [ ] `/send` searches iTunes, lets you pick a song, send a Shout with a
      message, and the recipient can react (preset or custom emoji).
- [ ] `/shouts/[id]` page + audio preview player plays the provider preview.
- [ ] `/profile` shows stats + recent activity; avatar upload accepts a small
      JPEG/PNG/WebP and rejects oversized/non-image files.
- [ ] Protected routes (`/dashboard`, `/friends`, `/send`, `/profile`,
      `/settings`, `/notifications`, `/shouts/[id]`) redirect unauthenticated
      users to `/login` (see `src/proxy.ts`).
- [ ] Security headers present: `curl -sI https://<app>/` shows
      `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
      `Referrer-Policy`, `Permissions-Policy`.
- [ ] The public API routes `/api/songs/search` and `/api/artwork` are
      authenticated-only and rate-limited (429 + `Retry-After` on bursts).

## 5. Known limitations

- **Rate limiting is in-memory** (`src/lib/rate-limit.ts`). On Vercel each
  serverless instance keeps its own counter, so the limit is per-instance, not
  global. For a hard global cap, swap in a shared store (Upstash Redis or a
  Postgres table) — the `rateLimit` signature already takes a key + window.
- **Strict CSP is deferred.** The FOUC-prevention inline script in
  `src/app/layout.tsx` needs a nonce/hash infrastructure before a strict CSP
  can be enabled; the current security headers omit CSP on purpose.
- **Avatars:** old objects are not deleted when an avatar is replaced (the new
  upload is validated server-side; cleanup is a future task).
- **Email delivery is disabled** (no confirmation emails; forgot/reset flows
  are not wired to the UI).