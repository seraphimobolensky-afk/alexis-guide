# Phase Log

A running record of what changed in each phase of work, kept so progress can be tracked without digging through git history.

---

## Phase 0 — Staging environment setup
**Date:** 2026-09-19

**What changed:**
- Confirmed working tree was clean on `main`.
- Created branch `redesign` and pushed it to GitHub with upstream tracking (`origin/redesign`).
- Ran `npm install` — succeeded (see note on vulnerabilities below).
- Ran `npm run build` — initially **failed**: `.env.local` had placeholder values (`your-supabase-project-url` / `your-supabase-anon-key`) instead of real Supabase credentials, so the `/login` page couldn't prerender. Fixed by updating `.env.local` with the real Supabase project URL and anon key. Rebuilt successfully afterward.
- Started `npm run dev`, confirmed the app responds at `localhost:3000` (redirects to `/login`, loads with HTTP 200), then stopped the dev server.
- Read `supabase-schema.sql` (defines `checklist_completions` table + row-level security policy — project-agnostic) and `.env.local` to confirm which Supabase project the app is connected to: **`rxbmgdcicgozvtzihwse`**.
- Also had to re-authenticate git with GitHub: the stored credential had expired/was invalid (GitHub no longer accepts password auth). Fixed by generating a Personal Access Token and storing it via the macOS keychain credential helper.
- Created `STAGING.md` (plain-English guide to the staging workflow).
- Created this file, `PHASE-LOG.md`.

**Files touched:**
- `.env.local` (not committed — gitignored; contains real Supabase credentials now instead of placeholders)
- `STAGING.md` (new)
- `PHASE-LOG.md` (new)

**Anything to click:**
- **Vercel:** confirmed `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are enabled for both Production and Preview environments; confirmed Production Branch is `main`. Stable staging URL: `https://alexis-guide-git-redesign-seraphim-s-projects2.vercel.app`.
- **Supabase:** added `https://alexis-guide-git-redesign-seraphim-s-projects2.vercel.app/auth/callback` to Authentication → URL Configuration → Redirect URLs, so magic-link login works on the staging preview. Confirmed working end-to-end.
- **Note:** `npm audit` reported 9 vulnerabilities (2 moderate, 6 high, 1 critical) in dependencies — not fixed in this phase since it wasn't in scope; flagging for a future phase.

**Status:** Staging environment fully working and verified (login tested successfully on the preview URL). Phase 0 complete.
