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

---

## Phase 1 — Design foundation
**Date:** 2026-09-19

**What changed:**
- Rebuilt `app/globals.css` with a real design token system in `:root`: `--bg`, `--surface`, `--text-primary`, `--text-secondary`, `--text-muted`, `--accent`, `--border`, plus the five shadow tokens. All CSS Modules across the app now reference these tokens — no component defines its own colors.
- Added a full dark theme (base `#23262b`, not an inverted light theme): dimmer top-left highlight, darker bottom-right shadow, reduced shadow opacity throughout so raised/pressed surfaces stay legible instead of turning muddy.
- Theme switching via `data-theme="light"|"dark"` on `<html>`, defaulting to `prefers-color-scheme`, overridable by the user and remembered in `localStorage`. An inline script in `app/layout.tsx` sets the attribute before first paint (no flash of the wrong theme).
- Added `ThemeToggle` (`components/ThemeToggle.tsx` + `.module.css`) — inline SVG sun/moon, no icon library. Placed top-right of the guide layout (fixed position) as an interim spot; Phase 4 will move it into the nav.
- Checked contrast on every text/background pair in both themes (WCAG relative-luminance formula) — all pass 4.5:1 with margin:
  - Light: text-primary 11.89:1, text-secondary 5.61:1, text-muted 4.74:1, accent 5.12:1
  - Dark: text-primary 12.49:1, text-secondary 6.59:1, text-muted 5.18:1, accent 5.81:1
  - The old `--light-silver` and `--faint` colors (was ~1.2–1.4:1, nearly invisible) are gone; `--dark-silver`/`--mid-silver` (was ~4.15:1, also failing) were folded into the new `--text-secondary`.
- Typography: body text is now 16px/1.55 minimum (recipe steps/ingredients, tips, notes — anything read at length), secondary/caption text (subtitles, labels, buttons) is 14px minimum, and nothing is smaller than 12px except uppercase eyebrow labels with letter-spacing (which were bumped from 9–10px to 12px). All `<input>` elements are 16px to stop iOS auto-zoom. Font stack (Nunito/Avenir Next) unchanged.
- Mobile foundation: `100vh` replaced with `100dvh` everywhere (login page, guide shell, sidebar) to fix the iOS address-bar jump; `env(safe-area-inset-*)` padding added around the guide shell, sidebar, and login card; fluid side padding via `clamp()`; interactive touch targets (nav items, buttons, sign-out, theme toggle) are all ≥44×44px. Breakpoints normalized to 640px and 1024px as plain media queries (no `@custom-media` — this project's PostCSS pipeline only runs the Tailwind plugin, which isn't in use, and has no custom-media plugin registered, so that syntax would not have been processed by any browser).
- Below 640px the guide sidebar stacks above the content (column layout, nav wraps horizontally) instead of squeezing into a fixed 200px column — navigation itself is unchanged, this is just responsive stacking per the phase scope (structural nav rework is Phase 4).
- Verified with `npm run build` (passes) and `npm run dev` (loads at `localhost:3000`, redirects to `/login`, 200 OK).
- Did **not** visually verify the dark theme, theme toggle, or mobile breakpoints in an actual browser — Claude's Chrome browser tools were not enabled for this session. Structural/computational checks (contrast math, build output, rendered HTML for the theme-init script) were done instead. Flagging this so a real visual pass gets done before this phase is considered fully done.

**Files touched:**
- `app/globals.css` (full rework — tokens, dark theme, base typography, mobile foundation)
- `app/layout.tsx` (added pre-paint theme-init script)
- `app/guide/layout.tsx`, `app/guide/layout.module.css` (added ThemeToggle slot, dvh, safe-area, mobile stacking)
- `components/Sidebar.module.css` (tokens, font sizes, touch targets, mobile stacking)
- `components/ChecklistCard.module.css`, `components/SectionHeader.module.css`, `components/TipList.module.css` (tokens, font sizes, touch targets)
- `app/login/login.module.css` (tokens, font sizes, dvh, safe-area, 16px input)
- `app/guide/appliances/appliances.module.css`, `app/guide/groceries/groceries.module.css`, `app/guide/materials/materials.module.css`, `app/guide/recipes/recipes.module.css` (tokens, font sizes, breakpoint normalization to 640px)
- `components/ThemeToggle.tsx` (new), `components/ThemeToggle.module.css` (new)

**Anything to click:**
- Nothing required in Vercel or Supabase for this phase — it's CSS/component-only.
- Recommended: once Chrome browser tools are available (`/chrome`), do a real visual pass on the staging preview — check the theme toggle in both themes, and resize down to a phone width to confirm the sidebar stacks cleanly.

**Post-deploy note (login troubleshooting):** while testing staging login after this phase, a magic-link email appeared to redirect to production. Root cause was not a bug — Supabase magic-link emails all share the same sender/subject, so Gmail threads old and new ones together, and an old email (requested before staging existed) was clicked instead of a fresh one. That old link correctly went to production, since that's what was requested at the time. Fix was simply requesting a fresh link and using the newest message in the thread. Worth remembering for future login testing: always check the email timestamp, or archive old magic-link emails before testing.

**Status:** User confirmed staging login and Phase 1 changes look good end-to-end.
