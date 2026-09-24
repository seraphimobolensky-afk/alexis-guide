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

---

## Phase 2 — Real content transcription
**Date:** 2026-09-19

**What changed:**
- Extracted the source PDF (`../A guide to living alone.pdf`, one folder up from the repo) with PyMuPDF, since `pdftotext` (poppler) isn't installed on this machine and there's no Homebrew to add it. PyMuPDF is a self-contained Python library with no system dependency and gave the same reading-order text plus per-line position/font data, which was used to reconstruct the exact nested-bullet hierarchy. Confirmed the PDF has no images — it's text-only, so nothing was missed to a non-text element.
- Redesigned the types in `lib/content.ts`: new `Bullet { text, children? }` type supporting arbitrary nesting (used at 3 levels deep in several places — e.g. the laundry cleaning task, the Sponges material row, the Coffee machine appliance, "Be active" in Life balance). `CleaningTask` now holds `bullets: Bullet[]` instead of one summarized `tip` string, and `frequency` is now her exact phrase instead of a normalized category. `Appliance` gained a `use` field (previously dropped) and `necessity` became a string to support ranges like "3-5". `Material` and grocery/roommate/life/uni tips all moved from flat strings to `Bullet[]`.
- Transcribed all seven numbered sections plus Academic tips, replacing every previously-summarized paraphrase with Sera's actual wording. This restored content that had been silently dropped by the earlier summary: 6 missing appliances (Ice trays, TV, Ironing board & iron, Cheap monitor on your desk, Beard trimmer, Safety razor) plus "Bowls" split back out from "Big bowl", a missing material ("Glass cleaner (optional)"), a missing recipe ("Boiled eggs on toast"), the `use` column for every appliance, and the Coffee machine's full nested Price-wise/Taste-wise/Ease-of-use breakdown (previously one paraphrased sentence).
- Added the opening letter ("Dear Alexis...") as a new first section, key `welcome`, label "Start here" — added to the `sections` nav array. Added the closing note ("I'm super excited for you...") to the bottom of the Academic tips (Uni) page, since that's the last page in both the app's nav order and the PDF's own reading order.
- Replaced every section's invented one-line subtitle with the actual PDF intro paragraph for that section (or removed the subtitle where the PDF has none — Appliances, Recipes). `SectionHeader` now accepts `subtitle` as a string or string array to support multi-paragraph intros.
- Updated `TipList` and `ChecklistCard` to render `Bullet[]` with nested children; built a new shared `Bullets` component (recursive, indented, used across materials, appliances, recipes, and the tip-list pages) for consistent nested rendering.
- Updated the materials, appliances, recipes, groceries, roommates, life, and uni pages to use the new nested content and render it with clear visual hierarchy (indentation, reduced text weight per depth, all touch targets/type sizes still meeting Phase 1's minimums).
- Root (`/`) and the auth callback now redirect to `/guide/welcome` instead of `/guide/cleaning`, since the letter is the new intended landing page.
- Applied only the fixes explicitly allowed: spelling (e.g. "gilette" → "Gillette", "chords" → "cords", "species" → "spices"), grammar (e.g. subject-verb agreement fixes, a missing article), capitalisation of headings and proper nouns (e.g. "Ilkhom", "Pfadi", "Instagram", "Black Friday"), and cleanup of PDF-extraction artifacts (stray zero-width spaces after every bullet marker). Every other word, joke, and aside — including profanity and slang — was left exactly as written. Full list with one-word reasons per change in `CONTENT-REVIEW.md`.
- Wrote `CONTENT-REVIEW.md` at the repo root: source text vs. app text side by side for every section, the full change log, one flagged inconsistency in the PDF itself (Bolognese mentions wine in a step but not in its ingredients list — left as-is rather than invented), and a list of what in the app has no PDF source (icons/emoji, nav short-labels, small structural UI eyebrows like "Bonus"/"Start here").
- Verified with `npm run build` (passes) and `npm run lint` (passes — also fixed two pre-existing/incidental lint issues: a `let` that should've been `const` in the cleaning page, and a `setState`-in-effect pattern in `ThemeToggle` from Phase 1, now justified with a comment since it's reading a DOM attribute the pre-paint script already set).
- Did **not** visually verify the new nested-bullet rendering in an actual browser — Chrome browser tools remain unavailable this session. Verified via build success, lint, and direct content spot-checks (grepped `lib/content.ts` for every claimed fix and every preserved joke/slang line to confirm the review doc matches the actual code). A real visual pass on staging is still recommended, especially for the deep 3-level nesting on a phone screen.

**Files touched:**
- `lib/content.ts` (full rewrite)
- `components/Bullets.tsx` (new), `components/Bullets.module.css` (new)
- `components/TipList.tsx`, `components/TipList.module.css`
- `components/ChecklistCard.tsx`, `components/ChecklistCard.module.css`
- `components/SectionHeader.tsx`, `components/SectionHeader.module.css`
- `components/ThemeToggle.tsx` (lint fix only)
- `app/guide/welcome/page.tsx` (new), `app/guide/welcome/welcome.module.css` (new)
- `app/guide/cleaning/page.tsx`, `app/guide/cleaning/cleaning.module.css`
- `app/guide/materials/page.tsx`, `app/guide/materials/materials.module.css`
- `app/guide/appliances/page.tsx`, `app/guide/appliances/appliances.module.css`
- `app/guide/groceries/page.tsx` (removed now-unused `groceries.module.css`)
- `app/guide/recipes/page.tsx`, `app/guide/recipes/recipes.module.css`
- `app/guide/roommates/page.tsx`
- `app/guide/life/page.tsx`
- `app/guide/uni/page.tsx`, `app/guide/uni/uni.module.css` (new)
- `app/page.tsx`, `app/auth/callback/route.ts` (redirect target updated to `/guide/welcome`)
- `CONTENT-REVIEW.md` (new)

**Anything to click:**
- Nothing required in Vercel or Supabase — content/component-only, no schema or env changes.
- Recommended: read through `CONTENT-REVIEW.md` to confirm nothing was invented or lost, and flag anything I should reconsider (especially the "Swisher" vs. "Swiffer" naming question and the Bolognese wine inconsistency, both called out in that doc).
- Recommended: once Chrome browser tools are available, do a visual pass on staging — check the nested bullets render with clear hierarchy on a phone screen, especially the 3-level-deep ones (laundry, coffee machine, "Be active").

---

## Phase 3 — Collapsible cards
**Date:** 2026-09-19

**What changed:**
- Built a reusable `ExpandableCard` component (`components/ExpandableCard.tsx` + `.module.css`): collapsed state shows only icon, title, and an optional small meta chip; the whole header is a real `<button>` with `aria-expanded`/`aria-controls` (via `useId()`), a focus-visible ring (inherited from the global `:focus-visible` rule), and a chevron that rotates 90° on open. The content region animates open/closed with `grid-template-rows: 0fr → 1fr` (no hardcoded max-height, so it handles the very different content lengths from Phase 2 correctly) using a springy `cubic-bezier(0.34, 1.56, 0.64, 1)` curve over 280ms; a `persistent` slot renders content that stays visible regardless of open state. A `@media (prefers-reduced-motion: reduce)` block removes both the height and chevron transitions entirely, so reduced-motion users get an instant show/hide with no animation.
- Built `lib/useExpandableGroup.ts`, a small hook that tracks open/closed state per id in a group, so any number of cards on a page can be open at once, independently, for as long as you stay on that page. Built `ExpandAllControl` (`components/ExpandAllControl.tsx`), a small pill button that flips between "Expand all"/"Collapse all" based on whether every card in the group is open.
- Applied `ExpandableCard` to cleaning materials, appliances, and roommates/life-balance/uni-tips/groceries (the last four via `TipList`, updated to render each top-level tip as an `ExpandableCard` when it has sub-bullets, or as a plain static row when it doesn't — several tips are single sentences with nothing to expand, so those don't get a non-functional chevron).
- Replaced the bespoke single-open accordion on the Recipes page with `ExpandableCard`. This is a genuine behavior fix, not just a refactor: the old accordion only allowed **one** recipe open at a time (`useState<string | null>`); now every recipe can be open independently, per the spec.
- For cleaning tasks: `ChecklistCard` now renders through `ExpandableCard`, with the tip bullets as the collapsible content and the "Mark done" button passed via the `persistent` slot, so it's visible and tappable whether the card is expanded or not — ticking things off stays fast. Since the cleaning page needs both this per-card state and its server-fetched Supabase completions, added a small client wrapper (`components/CleaningList.tsx`) that the (still server-side, still async) cleaning page renders into.
- Added the "Expand all / Collapse all" control to every section that ended up with more than 4 cards: cleaning (11), materials (14), appliances (21), recipes (7), groceries (7 expandable), roommates (7 expandable), life balance (12), uni tips (5). In practice every section qualifies with the current content.
- Necessity rating on the Appliances page moved into the collapsed-state meta chip (small dot indicator + "N/5" text) instead of always-visible; the `use` line moved into the expanded content, since collapsed state is meant to show only icon/title/meta.
- Verified with `npm run build` (passes) and `npm run lint` (passes, no new issues). Smoke-tested every route with the dev server running — all `/guide/*` pages correctly redirect to `/login` when unauthenticated with no server errors, confirming the new client components compile and mount cleanly.
- Did **not** visually verify the animation itself (the spring easing, the chevron rotation, the reduced-motion behavior) in an actual browser — Chrome browser tools are still unavailable this session. This is worth a real look before considering the phase fully done, especially the reduced-motion path, which can't be verified by a build/lint pass alone.

**Files touched:**
- `components/ExpandableCard.tsx` (new), `components/ExpandableCard.module.css` (new)
- `components/ExpandAllControl.tsx` (new), `components/ExpandAllControl.module.css` (new)
- `lib/useExpandableGroup.ts` (new)
- `components/CleaningList.tsx` (new)
- `components/ChecklistCard.tsx`, `components/ChecklistCard.module.css`
- `components/TipList.tsx`, `components/TipList.module.css`
- `app/guide/cleaning/page.tsx`
- `app/guide/materials/page.tsx`, `app/guide/materials/materials.module.css`
- `app/guide/appliances/page.tsx`, `app/guide/appliances/appliances.module.css`
- `app/guide/recipes/page.tsx`, `app/guide/recipes/recipes.module.css`

**Anything to click:**
- Nothing required in Vercel or Supabase — component/UI-only.
- Recommended: once Chrome browser tools are available, check the actual feel of the expand animation on staging (does it feel "weighted" as intended, does the chevron rotation look right, does turning on "reduce motion" in system settings actually kill the animation), and try the "Expand all"/"Collapse all" control on a long section like Appliances.

---

## Phase 4 — React Bits CardNav replaces the sidebar
**Date:** 2026-09-19

**What changed:**
- Fetched `https://reactbits.dev/r/CardNav-TS-CSS.json` directly with `curl` (not `npx shadcn init`, which would've pulled in the Tailwind toolchain) and parsed the registry JSON to pull out the exact `CardNav.tsx`/`CardNav.css` source before writing anything. Installed the two declared dependencies, `gsap` and `react-icons`.
- **Read the source and found several things worth flagging before wiring it up:**
  - The component is built to be an absolutely-positioned floating overlay (`position: absolute; top: 2em; left: 50%`), not a normal in-flow sticky header — it's meant to sit on top of a hero image, not act as a page header. Changed to `position: sticky; top: 0` and made it a normal block in the layout flow, matching what was actually asked for.
  - Its expanded-height calculation only measures real content height on mobile (`max-width: 768px`); on desktop it always returns a **hardcoded `260`**, regardless of how much content is actually in the panel — the same kind of guess Phase 3 explicitly told us to avoid. Fixed it to always measure the real content height, on every screen size.
  - The logo prop only accepts an image URL (`<img src={logo}>`) with no link wrapper at all — not clickable, and this app has no logo image asset. Added an optional text-based `brandLabel` alternative and wrapped it in a Next.js `Link` to `/guide/welcome`, as the phase asked for.
  - Nav links are plain `<a href>` tags, which would force full page reloads in a Next.js app; swapped for `next/link`.
  - There's no click-outside-to-close, no Escape-to-close, and no `prefers-reduced-motion` handling at all — all three were required by this phase's spec and had to be added from scratch, not just reconfigured.
  - The hamburger trigger is a `<div role="button">` rather than a real `<button>`; changed it to a real button to match the accessibility bar the rest of the app (Phase 3) already holds itself to.
  - Colors are hardcoded throughout (`white`, `#111`, `#000`) both in the CSS and as component prop defaults; replaced every one with the Phase 1 tokens (`--bg`, `--text-primary`, `--text-secondary`, `--text-muted`, `--accent`, `--border`, `--shadow-*`), so it now follows system/manual dark mode like everything else.
  - It ships a decorative, non-functional "Get Started" CTA button with no `href` or handler. Removed it — the phase's actual requirement (sign-out + theme toggle) needed a real slot instead, so I added an `actions` prop that renders as its own row at the bottom of the expanded panel, and used it for that.
  - Kept the core GSAP height/opacity timeline approach and the overall card-grid structure, since that's the actual "feel" being asked for — this was an adaptation, not a rewrite from scratch.
- Deleted `components/Sidebar.tsx` and `components/Sidebar.module.css`. There is now exactly one navigation, `GuideNav` (a new client wrapper around `CardNav` that owns the sign-out logic moved over from the old sidebar), used by `app/guide/layout.tsx` on every screen size.
- Grouped the 8 real sections plus 2 not-yet-built ones into the 3 required card groups (`lib/navGroups.ts`): "Keep the place running" (cleaning, materials, appliances, habits), "Food" (groceries, grocery-list, recipes), "Life in London" (roommates, life, uni). `habits` and `grocery-list` are marked `disabled: true` in that config — they render as visibly muted, non-navigating placeholders with a small "Soon" tag rather than a link to a route that doesn't exist yet, so the app can't crash on them and it's a one-line flip (`disabled: false` + a real `href`) to enable each once Phases 8/9 ship.
- Mobile handling: hamburger button is a 44×44px real tap target: the expanded panel has `max-height: calc(100dvh - 24px - env(safe-area-inset-top))` with `overflow-y: auto` on the content area, so it scrolls instead of overflowing on a short screen; clicking/tapping outside the nav closes it; Escape closes it; and when `prefers-reduced-motion: reduce` is set, the GSAP timeline runs with duration 0 (an instant show/hide) instead of animating.
- Restructured `app/guide/layout.module.css`: the old fixed flex-row shell (sidebar + scrollable main) is gone, replaced with a single flex-column shell — `GuideNav` on top (sticky), `<main>` below it, centered at a 720px comfortable reading width with the existing fluid mobile padding and safe-area insets from Phase 1.
- Verified with `npm run build` (passes) and `npm run lint` (passes — one pre-existing-pattern warning from Next.js about the registry component's optional `<img>` fallback path, which isn't actually exercised since this app uses the text `brandLabel` instead of an image logo). Since the guide layout redirects unauthenticated users before rendering children, and there's no way to complete the magic-link flow from this environment, temporarily bypassed the auth redirect behind a one-off env var to confirm `GuideNav`/`CardNav` actually server-renders without error — verified the markup for both nav groups and the disabled placeholders came through correctly, then fully reverted the bypass (confirmed via `git diff` showing a clean revert) before committing.
- Did **not** visually verify the GSAP expand animation, the click-outside/Escape behavior, or the reduced-motion path in an actual browser — Chrome browser tools are still unavailable this session. This one in particular really needs a real look on staging, since GSAP/DOM-measurement behavior (especially `calculateHeight`'s temporary style-swap trick) is exactly the kind of thing that can look right in code and still be off in practice.

**Files touched:**
- `components/CardNav.tsx` (new — adapted from the React Bits registry), `components/CardNav.css` (new — adapted)
- `components/GuideNav.tsx` (new), `components/GuideNav.module.css` (new)
- `lib/navGroups.ts` (new)
- `components/Sidebar.tsx` (deleted), `components/Sidebar.module.css` (deleted)
- `app/guide/layout.tsx`, `app/guide/layout.module.css`
- `package.json` / `package-lock.json` (added `gsap`, `react-icons`)

**Anything to click:**
- Nothing required in Vercel or Supabase — component/dependency-only change.
- Recommended: once Chrome browser tools are available, actually open the nav on staging — check the expand/collapse animation feel, that tapping outside and pressing Escape both close it, that it scrolls instead of clipping on a short/landscape phone screen, and that turning on "reduce motion" in system settings makes it snap open/closed instantly instead of animating.
- Worth deciding before Phases 8/9: the exact route paths I guessed for the not-yet-built sections — `/guide/habits` and `/guide/grocery-list` — since those are what's baked into `lib/navGroups.ts` now.

**Post-deploy fix:** user reported the expanded mobile panel wasn't sizing correctly — group headers and links were overlapping instead of stacking, cutting content off rather than growing the panel to fit. Root cause: `.nav-card`'s desktop rule `flex: 1 1 0` (equal-width columns in a *row*) was still active inside the mobile media query, where `.nav-cards-row` switches to `flex-direction: column` — in a column flex container that same rule makes all three groups split the available height *equally* regardless of how many links each one has, so a 4-link group overflowed into the next card instead of the whole panel growing taller. Fixed by adding `flex: 0 0 auto` to `.nav-card` inside the mobile media query, so each card sizes to its own content and the column (and therefore the measured panel height GSAP animates to) grows to fit everything. `components/CardNav.css` only; rebuilt and re-linted clean.

---

## Phase 5 — Email + password auth
**Date:** 2026-09-19

**What changed:**
- `/login` now uses `supabase.auth.signInWithPassword` instead of a fresh magic link every time: email + password fields, a "Show/Hide" password-visibility toggle, `autocomplete="email"`/`autocomplete="current-password"` on the inputs so phone keychains offer to fill them, and human error messages instead of raw Supabase strings (see the error-mapping note below).
- New `/auth/reset` page: asks for an email, calls `resetPasswordForEmail` with `redirectTo` pointing at `/auth/callback?next=/auth/set-password`.
- New `/auth/new` page ("New here? Create your account" from the login page): asks for an email, sends a magic link via `signInWithOtp` that also lands on `/auth/callback?next=/auth/set-password`.
- New `/auth/set-password` page: a signed-in-only page (server-checked — redirects to `/login` if there's no session, same pattern as the guide layout) with a client form that calls `supabase.auth.updateUser({ password })`. Requires 8+ characters and a confirm field that must match, then redirects into `/guide/welcome`.
- `app/auth/callback/route.ts` now honours a `next` query parameter, but only if it's a same-site relative path starting with a single `/` — an absolute URL, or a protocol-relative `//evil.com`-style one, is ignored and falls back to `/guide/welcome`. This is what lets the reset/create-account links above land on `/auth/set-password` instead of always going straight into the guide.
- **Access control:** added `ALLOWED_EMAILS` (comma-separated, read server-side only — `lib/auth.ts` is never imported into a client component) to gate both sign-in and account creation. The list is fail-closed: if the env var is empty or missing, nobody gets in rather than everyone, so a forgotten Vercel env var fails loudly instead of quietly becoming an open door. Added it to `.env.local` with your email (`seraphim.obolensky@gmail.com`, the one you said your existing account uses) and a placeholder for Alexis's — **you need to fill that placeholder in with her real email before this works for her.** I also extended the same allowlist check to the password-reset flow, even though the phase only named sign-in and account creation — since account creation is already gated, a non-allowlisted email shouldn't have an account to reset in the first place, so this is just closing the same door from a third angle. Flagging this in case you'd rather it only apply to the two named flows.
- Kept the existing server-side auth check in `app/guide/layout.tsx` untouched, as instructed.
- **On the "clear, human error messages" requirement, a real constraint worth knowing about:** Supabase's `signInWithPassword` deliberately returns the identical "Invalid login credentials" error for a wrong password, a nonexistent account, *and* an account that exists but never had a password set (e.g., someone who only ever used the old magic-link flow) — this is intentional on Supabase's side, to stop attackers from using the error message to figure out which emails have accounts. I can't un-ambiguate what Supabase deliberately hides. What I did instead: the *one* case that's genuinely distinguishable up front — an email that isn't on the allowlist at all — gets its own clear message before Supabase is even called. For the rest, rather than a bare "invalid credentials," the message explicitly points at both real possibilities: "...If you haven't set a password yet, use 'Create your account' below, or reset your password." A "too many attempts" case is separately mapped from Supabase's rate-limit errors.
- Added a `--danger` colour token (light `#b3261e` / dark `#ff8a80`, both checked at ≥4.5:1 against the theme background) to `app/globals.css` for form error text, since Phase 1 didn't define one and these forms needed an accessible way to show errors in colour, not just plain text.
- Verified with `npm run build` (passes, three new routes appear: `/auth/new`, `/auth/reset`, `/auth/set-password`) and `npm run lint` (passes after fixing two straight-apostrophe JSX errors — one pre-existing `<img>`-usage warning remains, unrelated to this phase, from Phase 4's CardNav). Smoke-tested all four auth routes with the dev server: `/login`, `/auth/reset`, `/auth/new` all return 200; `/auth/set-password` correctly 307-redirects to `/login` when signed out, confirming the auth guard works without needing to fake a session.
- **One cosmetic oddity worth flagging, not a bug:** the server-rendered HTML for the password inputs shows `autoComplete="email"` (camel-case) rather than the lowercase `autocomplete="email"` I expected from React's usual attribute-name mapping — confirmed identical in both `next dev` and a real production build (`next build && next start`), so it's how this React 19 / Next 16 combination serializes that specific prop now, not something introduced by this change. HTML attribute names are case-insensitive on the browser's parser, so this has no effect on actual autofill/keychain behavior — just flagging it because it looked wrong at first glance.
- Did **not** actually exercise these flows end-to-end against real Supabase (sign in with a real password, receive a real reset/create-account email, land on `/auth/set-password` from a real link) — that requires clicking real email links, which isn't possible from this environment. This absolutely needs a real walkthrough before considering the phase done: sign in with a password, use "Forgot password," use "Create your account," and confirm each one lands where it should.

**Files touched:**
- `app/login/page.tsx`, `app/login/login.module.css` (rewritten for password auth)
- `app/auth/reset/page.tsx` (new)
- `app/auth/new/page.tsx` (new)
- `app/auth/set-password/page.tsx` (new), `app/auth/set-password/SetPasswordForm.tsx` (new)
- `app/auth/auth.module.css` (new, shared by the three pages above)
- `app/auth/actions.ts` (new — the one server action, `checkEmailAllowed`)
- `app/auth/callback/route.ts` (honours safe `next` param)
- `lib/auth.ts` (new, server-only allowlist helpers)
- `lib/authErrors.ts` (new, client-safe error-message mapping)
- `app/globals.css` (added `--danger` token, all three theme blocks)
- `.env.local` (added `ALLOWED_EMAILS` — not committed, gitignored)

**Anything to click:**
- **Vercel:** add `ALLOWED_EMAILS` as an environment variable (same comma-separated value as `.env.local`, once Alexis's real email is filled in) for both Production and Preview — same pattern as the Supabase keys in Phase 0. Without this, sign-in will fail closed for everyone in production.
- **Supabase:** see the step-by-step dashboard walkthrough given directly to the user alongside this log entry — enabling email+password sign-in, confirming redirect URLs cover the new `?next=` query parameter, and checking the reset-password email template.
- Please fill in Alexis's real email in `ALLOWED_EMAILS` in `.env.local` (and then in Vercel) — it's currently a placeholder.

**Post-deploy verification:** `ALLOWED_EMAILS` was set in `.env.local` with the real emails (`seraphim.obolensky@gmail.com`, `obolensky35@gmail.com`, `jennayang04@gmail.com`), then added to Vercel — Production and Preview — via **Project Settings → Environments → (Production row) → Add Environment Variable**, checking both the Production and Preview boxes in that same dialog rather than adding it twice on separate screens (Vercel's UI has moved since Phase 0; env vars now live inside each environment's own settings, not a standalone "Environment Variables" page). Redeploying required going through the plain **Deployments** list rather than the **Redeploy** popup from Settings — that popup's deployment picker showed the same stale, 96-day-old `main`-branch entries regardless of whether "Production" or "Preview" was selected in its own environment filter, which looks like a bug/quirk in that specific dialog rather than an actual problem with the `redesign` branch (Preview correctly tracks "all unassigned git branches," `redesign` included). Once redeployed, the user confirmed the full chain works end-to-end against real Supabase: **Create your account** → email link → **Set a password** page → set password → landed in the guide; **sign in** with that email + password at `/login` worked; **Forgot password** → email link → set a new password also worked. Phase 5 is fully verified, not just built.

---

## Phase 6 — Visual treatment for the signed-out screens
**Date:** 2026-09-19

**What changed:**
- Fetched both registry files directly with `curl` (no `npx shadcn init`): `https://reactbits.dev/r/WarpText-TS-CSS.json` → `components/WarpText.tsx`/`.css`, `https://reactbits.dev/r/SpecularButton-TS-CSS.json` → `components/SpecularButton.tsx`/`.css`. Installed the one shared dependency, `ogl`.
- **Read both sources before wiring anything up, per the instructions — here's what I found and what I changed:**
  - **WarpText was already excellent.** It already handles `prefers-reduced-motion` (a live-updating media-query listener flips a `uMotion` shader uniform, freezing the drift instead of just capping frame rate), already pauses its render loop via `document.visibilitychange` and an `IntersectionObserver` (so it doesn't burn cycles in a background tab or off-screen), and already fully tears down on unmount — cancels the RAF, disconnects both observers, deletes the GL texture, removes the program/geometry, calls `WEBGL_lose_context`, and removes the canvas node. The only thing missing for this app's purposes was a way to *know* whether WebGL actually came up, so I added an optional `onStatusChange?: (status: 'ready' | 'error') => void` prop, called from the existing try/catch around `Renderer` construction and right after the canvas successfully attaches — nothing about its rendering or cleanup behavior was touched.
  - **SpecularButton needed real work.** Three gaps, all now fixed: (1) no `prefers-reduced-motion` handling *at all* — the shine's angle animated continuously regardless of OS setting, so I added a static single-frame render path (fixed angle, calmed-down intensity) that's used instead of ever starting the `requestAnimationFrame` loop when reduced motion is on, with a live media-query listener so toggling the OS setting mid-session switches between the two immediately; (2) no try/catch around `new Renderer(...)` at all, unlike WarpText — if WebGL was unavailable this would have thrown an *uncaught* error straight out of the effect; wrapped it the same way WarpText does, added the same `onStatusChange` callback, and added a `webglcontextlost` handler (also absent) so a lost context stops the loop cleanly instead of spamming render calls into a dead context.
  - **A newer lint rule (`react-hooks/refs`) flagged both the vendor code's own pattern and mine.** SpecularButton's original source mutates a ref directly in the render body (`propsRef.current = {...}`) to always have the latest prop values available inside the animation loop's closure — a common pre-React-19 idiom, but this project's ESLint config now treats "writing to a ref during render" as an error. Moved that assignment (and my own `onStatusChangeRef` sync, same issue) into a `useEffect` in both components instead. Also fixed four `prefer-const` errors in WarpText where `let x: Type;` was declared up top and assigned exactly once further down — inlined those into `const` at their point of use.
- Built the guardrails as their own reusable pieces, all under `components/`:
  - `WebglErrorBoundary.tsx` — a class component (error boundaries can't be hooks) that catches anything that still throws and swaps in a supplied fallback.
  - `AuthWarpBackground.tsx` — wraps `WarpText` behind `next/dynamic(..., { ssr: false })` and the error boundary. A gradient background plus plain static heading text (matching the real `<h1>` already in the card, so nothing is lost) render immediately and stay up until `onStatusChange('ready')` fires; the whole thing is `aria-hidden` since it's purely decorative background flavor, not new information.
  - `AuthSubmitButton.tsx` — same pattern for `SpecularButton`, but structured so a real, fully-functional `<button type="submit">` (styled like the rest of the app's buttons) is in the DOM and interactive from the very first paint — before any client JS runs at all — and is only `display:none`'d once the specular version is confirmed working; it comes right back the instant WebGL errors or the boundary catches something. This is what makes "the login form must remain fully usable with zero WebGL" actually true rather than aspirational.
  - `lib/useThemeColor.ts` (`useResolvedCssVar`) — WebGL/canvas code can't read `var(--accent)` directly, so this resolves a CSS custom property to its current literal color, returns the given fallback during SSR/first paint (no hydration mismatch), and re-resolves on `data-theme` attribute changes or an OS-level scheme change — this is what makes both components follow light/dark theme instead of using their hardcoded defaults.
- Built `AuthShell.tsx`: the full-bleed `AuthWarpBackground`, a radial-gradient scrim positioned between it and the card (so the card's contents stay readable regardless of what the shader is doing at any instant), and the glass card itself (`color-mix()`'d `--surface` at 88% opacity, `backdrop-filter: blur(20px)`, a thin `--accent`-tinted rim, plus a soft ambient accent glow) — echoing SpecularButton's rim-and-glow look without running a second WebGL instance just for the card border.
- Applied the same treatment to all four signed-out screens: `/login` (background text: "Hi Lesch! Are you ready?", exactly as specified), `/auth/reset` ("Reset your password"), `/auth/new` ("Welcome"), `/auth/set-password` ("Set a password") — the latter three reuse each page's own existing heading copy from Phase 5 rather than inventing new marketing lines. **No auth logic was touched** — every `onSubmit` handler, Supabase call, and piece of state from Phase 5 is byte-for-byte the same; only the surrounding JSX wrapper (`<div className={styles.page}><div className={styles.card}>` → `<AuthShell warpText="...">`) and the submit button component changed. Removed the now-dead `.page`/`.card`/`.btn` rules from `login.module.css` and `auth.module.css` (their job moved to `AuthShell.module.css` and `AuthSubmitButton.module.css`).
- **On contrast, since I can't literally pixel-sample a running WebGL canvas:** the card surface is a deliberately conservative 88% opaque (not, say, 60%), combined with the scrim absorbing most of what's directly behind the card, specifically so that even in a worst-case bright/dark instant from the shader, the surface's own color dominates enough that Phase 1's already-verified text-contrast ratios hold. I'm confident in the reasoning but haven't been able to visually confirm it — flagging this as the one thing in this phase most worth an actual look before considering it done.
- Verified with `npm run build` (passes, three new/unchanged auth routes still present) and `npm run lint` (passes, after the ref-mutation and `prefer-const` fixes above — one unrelated pre-existing warning remains from Phase 4's `CardNav`). Smoke-tested all four auth pages with the dev server: confirmed via `curl` that the server-rendered HTML contains the plain fallback button and fallback heading text (not any WebGL/canvas markup, correctly excluded by `ssr:false`), and that `/auth/set-password` still requires a session (temporarily bypassed the redirect the same way as Phase 4 to check its markup, then fully reverted — confirmed clean via `git diff` before committing).
- Did **not** visually verify any of this in an actual browser — Chrome browser tools are still unavailable to me this session despite being asked about, so the animated warp effect, the specular button's rim/glow, the glass card's blur, and (most importantly) real-world contrast were all built from source-level reasoning and code-level testing only, not from looking at it. This phase needs a real look on a real screen more than any phase so far.

**Files touched:**
- `components/WarpText.tsx` (new — adapted from the React Bits registry), `components/WarpText.css` (new — unchanged)
- `components/SpecularButton.tsx` (new — adapted), `components/SpecularButton.css` (new — unchanged)
- `components/WebglErrorBoundary.tsx` (new)
- `components/AuthWarpBackground.tsx` (new), `components/AuthWarpBackground.module.css` (new)
- `components/AuthSubmitButton.tsx` (new), `components/AuthSubmitButton.module.css` (new)
- `components/AuthShell.tsx` (new), `components/AuthShell.module.css` (new)
- `lib/useThemeColor.ts` (new)
- `app/login/page.tsx`, `app/login/login.module.css`
- `app/auth/reset/page.tsx`
- `app/auth/new/page.tsx`
- `app/auth/set-password/SetPasswordForm.tsx`
- `app/auth/auth.module.css`
- `package.json` / `package-lock.json` (added `ogl`)

**Anything to click:**
- Nothing required in Vercel or Supabase — this phase is purely visual/component work, no auth flow, schema, or env changes.
- Recommended: once Chrome browser tools are available, or on a real device, look at all four signed-out screens in both light and dark theme — this is the first phase where I genuinely could not verify the result myself.

**Post-deploy fix:** user sent screenshots (the first real look at this phase, on a laptop) showing the warp text overlapping and partially hidden behind the login card, since `WarpText` was centered across the *entire* page (same vertical center as the card) rather than confined to its own space above it. Fixed by restructuring `AuthShell` into a flex column — a `.textZone` band (height `clamp(100px, 18vh, 200px)`, so it scales with viewport but stays sane at the extremes) followed by the card, with a `gap` between them instead of independent absolute centering — so the two can never overlap regardless of card height or viewport size, and `WarpText`'s own fit-to-container sizing now works out proportionally within that band automatically. Moved the full-page gradient wash from `AuthWarpBackground` up into `AuthShell` (it now sits behind both the text zone and the card, not just behind the text), and widened the scrim to cover the whole content area instead of just where the card used to sit.

Also added the `ThemeToggle` (same component from Phase 1) to `AuthShell`, top-right corner — so it now appears on all four signed-out screens, not just requested for `/login` specifically. Flagging that scope choice: it seemed inconsistent to have it on login but not on reset/create-account/set-password, especially since dark/light mode has no other way to be changed pre-auth, but if only `/login` was wanted, easy to move it to that page alone instead.

Rebuilt and re-linted clean after both changes.

**Post-deploy fix 2:** user reported the cursor-following bulge/lens effect got noticeably weaker after the textZone fix above. Root cause: `WarpText`'s pointer-influence radius (`pointerInfluence`, default 0.42) is measured relative to *its own container's height*, and that container just shrank from the full page (~800-900px tall) down to the new `.textZone` band (~150-200px tall) — so the same radius setting now covers a proportionally tiny fraction of the screen. Fixed by explicitly setting `pointerInfluence={2.2}` and `pointerStrength={0.6}` (up from the defaults of 0.42/0.38) on the `WarpText` instance in `AuthWarpBackground.tsx`, to compensate for the much shorter container. Couldn't visually re-tune this live (no browser access), so these are a considered estimate based on the container's height ratio, not a measured match — please confirm it feels right, or give a "more/less" direction and I'll adjust further.

**Post-deploy fix 3:** user reported the radius from fix 2 was now too wide (more letters bulging than wanted) and the bulge magnitude was still too weak — specifically wanting the letter directly under the cursor to bulge the most, its immediate neighbours only slightly, and nothing beyond that. This needed an actual shader change, not just prop tuning: the original bulge falloff (`t * (1-t)^2 * 6.75`) is mathematically zero exactly at the cursor and peaks partway to the edge of the radius — the opposite of "biggest right under the cursor." Changed the falloff in `WarpText.tsx`'s fragment shader to `pow(1.0 - t, 3.0)`, which peaks at the cursor (t=0) and drops off sharply toward the radius edge, and doubled the displacement-magnitude constants (0.045→0.09, 0.016→0.03) to give more headroom before needing extreme prop values. Then retuned the exposed props in `AuthWarpBackground.tsx`: `pointerInfluence` tightened from 2.2 to 0.55 (much smaller radius — only the hovered letter plus immediate neighbours) and `pointerStrength` raised from 0.6 to 1.3 (stronger pull, now that the falloff shape and shader constants both work in its favor instead of against it). Still can't visually confirm this without browser access — this is a principled fix to the underlying math (the shape was objectively backwards before), but the exact radius/strength numbers are estimates and will likely need one more round of "more/less" feedback.

**Post-deploy fix 4:** user preferred the original falloff shape after all (the "ring" that peaks partway to the radius edge, not right at the cursor) and asked to drop the radius-tightening request entirely — just wanted the same effect as fix 2, but stronger. Reverted `WarpText.tsx`'s fragment shader completely back to the original vendor formula (`t * (1-t)^2 * 6.75`, and the original 0.045/0.016 displacement constants) — fix 3's shader edit is fully undone. In `AuthWarpBackground.tsx`, restored `pointerInfluence` to 2.2 (the fix-2 radius) and raised `pointerStrength` from 0.6 to 2.5 — roughly 4x the fix-2 value — for a substantially stronger pull. Rebuilt and re-linted clean; still unverified visually.

**Post-deploy fix 5:** user asked to dial the strength back slightly and reported the cursor movement now looked "laggy"/rippling rather than smooth. That second part isn't actually a smoothness/performance problem — it's the shader's ripple-ring effect (concentric sine-wave rings emitted from the cursor, controlled by the `ripple` prop), which shares the same `uPointerStrength` multiplier as the main bulge. Pushing strength to 2.5 in fix 4 scaled the ripple up right along with it, and at that level it reads as choppy rather than a clean, continuous bulge. Set `ripple={false}` in `AuthWarpBackground.tsx` to remove it entirely, and reduced `pointerStrength` from 2.5 to 1.8. Rebuilt and re-linted clean.

---

## Phase 7 — Habit tracking + grocery list database, and fixing the never-resetting checklist
**Date:** 2026-09-20

**What changed:**
- Extended `supabase-schema.sql` with three new tables — `habits`, `habit_entries`, `grocery_items` — each with `create table if not exists`, RLS enabled, and a "users manage their own rows" policy matching the existing one on `checklist_completions`. Also retrofitted every policy statement (the three new ones, and the pre-existing one) with `drop policy if exists` first, since Postgres has no `create policy if not exists` — without that, re-running this file a second time would error out on the policy statements, which directly contradicts "make it re-runnable."
- **One deliberate addition beyond the literal field list:** `habits` also has a `cadence` column (`'weekly' | 'biweekly' | 'monthly' | 'as_needed'`), which wasn't in the spec's column list. Without it there's no way to know which "done within window" rule applies to a given habit — the whole point of this table — so this is a necessary addition, not scope creep. Flagging it clearly since it wasn't asked for by name.
- `checklist_completions` is left in place, untouched structurally, with a comment marking it deprecated. The app no longer reads or writes it at all (confirmed via a repo-wide search after the change).
- Seeding the 11 cleaning tasks as `group='cleaning'` habits happens **in the app**, not in the SQL: the SQL editor has no authenticated user session, so there's no `auth.uid()` to seed against when you run it — a `create table` migration can't know which user(s) to seed rows for. Instead, `app/guide/cleaning/data.ts` checks (server-side, per request) whether the signed-in user already has any `group='cleaning'` habits, and if not, inserts the 11 from `lib/content.ts` using their existing `key` values, `title` as `label`, and the new `cadence` field. This runs automatically the first time the cleaning page loads for a user — no manual step needed, and it's safe to run on every request (it's a cheap existence check first).
- **Fixed the never-resetting checklist**, the actual bug this phase was named for: `app/actions.ts`'s old `toggleChecklist` upserted one permanent boolean per task per user — once checked, a task stayed "done" forever, it never reset. Replaced with `logHabitEntry`/`removeHabitEntry`, which write/delete a dated row in `habit_entries` (unique on `habit_id, entry_date`, so correcting today's entry updates that row rather than creating duplicates). `lib/habits.ts` computes, per the task's cadence, whether an entry falls inside its "done" window: weekly = since Monday (UTC), bi-weekly = last 14 days, monthly = this calendar month, as-needed = last 7 days — exactly as specified.
- Mapped each of the 11 cleaning tasks' free-text frequency (from Phase 2's transcription) onto one of those four cadence buckets. Most were direct (e.g. "Once a week" → weekly, "Whenever there's need" → as_needed), but a few don't fit cleanly since the source text describes cadences the spec's four buckets don't cover: Fridge ("Bi-monthly"), Kitchen extractor filter ("Every month or two"), and Kettle & coffee machines ("Once a month/bi-monthly") were all rounded to **monthly**, the closest available bucket, which is stricter than "every two months" actually means. Toilet bowl ("Once a week/bi-weekly") was mapped to **biweekly**, leaning toward the more lenient end of what the text itself allows. These are documented as a code comment on `CleaningTask.cadence` in `lib/content.ts` too, not just here.
- **On timezones, a known simplification:** window boundaries ("since Monday," "this calendar month," etc.) and "today" for logging are both computed with UTC-based date arithmetic, server-side, deliberately — not the user's actual local timezone. The reasoning: read (checking if a task is done) and write (logging today's entry) both need to agree on what day it is, and computing "today" the same way in the same place (the server) guarantees that, whereas mixing a client-computed local date for writes with a server-computed date for reads risks the two disagreeing right around a timezone boundary (e.g. "done today" written at 11pm local time landing on what the server considers the *next* UTC day, so it wouldn't show as done). The tradeoff is that very late-night logging near midnight could occasionally land on the "wrong" calendar day from the user's own perspective. Fine for a single-user personal app; worth revisiting if that ever changes.
- Redesigned `ChecklistCard` around this: the persistent (always-visible) area now shows a status line — "Done today," "Done — last done N days ago" (within window but not logged today), "Last done N days ago" (outside its window — overdue), or "Not logged yet" — plus a button that logs today's entry or removes it (toggle), instead of the old permanent "Mark done" checkbox. `CleaningList`/`app/guide/cleaning/page.tsx`/`app/guide/cleaning/data.ts` were restructured to fetch habits + their entries and compute this status server-side per request, replacing the old `checklist_completions` query entirely.
- Added a fallback message on the cleaning page ("Couldn't load your cleaning habits...") for the case where the habits table doesn't exist yet or the fetch otherwise comes back empty, rather than silently rendering an empty page — useful specifically for the window between deploying this code and actually running the SQL migration below.
- Built all seven requested server actions in `app/actions.ts`: `logHabitEntry`, `removeHabitEntry`, `addHabit`, `archiveHabit` (habits); `addGroceryItem`, `toggleGroceryPurchased`, `clearPurchasedGroceries` (groceries). Only the first two are actually wired into a UI yet (the cleaning page) — `addHabit`/`archiveHabit` support Phase 8's custom-habit UI and the three grocery actions support Phase 9's grocery-list page, neither of which exist yet. They're implemented and correct against the new schema, just unused until those phases build the screens that call them.
- Verified with `npm run build` (passes, no route changes) and `npm run lint` (passes, same pre-existing warning as prior phases). Smoke-tested the cleaning page and every other guide page with the dev server (temporarily bypassing the auth redirect again, then fully reverting — confirmed via `git diff`): all render 200 with no server errors. Could **not** test against the real new tables — they don't exist in the Supabase project until the SQL below is run, and this environment has no way to run it or to complete a real login to exercise the seeding/logging flow end-to-end. The code defensively handles missing tables/empty results (falls through to the setup-note message rather than crashing), which is what the smoke test actually exercised, but the full logging/window-computation logic needs a real pass after the migration is in place.

**Files touched:**
- `supabase-schema.sql` (added `habits`, `habit_entries`, `grocery_items`; deprecated `checklist_completions`; retrofitted `drop policy if exists` everywhere)
- `lib/habits.ts` (new — `Cadence` type, `todayDateString`, `isWithinCadenceWindow`, `daysAgoLabel`)
- `lib/content.ts` (added `cadence` to `CleaningTask` and all 11 tasks)
- `app/actions.ts` (rewritten — `toggleChecklist` removed, 7 new actions added)
- `app/guide/cleaning/data.ts` (new — seeding + status computation)
- `app/guide/cleaning/page.tsx` (uses the new data module)
- `components/CleaningList.tsx`, `components/ChecklistCard.tsx`, `components/ChecklistCard.module.css`, `app/guide/cleaning/cleaning.module.css`

**Anything to click:** see the copy-paste-ready SQL and exact Supabase dashboard steps given directly to the user alongside this log entry.

---

## Phase 8 — Habits tracking page
**Date:** 2026-09-20

**What changed:**
- Checked `npm info recharts@^3 peerDependencies` before installing, per instruction — every 3.x version declares `react: '^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0'`, so no conflict with this app's React 19. Installed `recharts@^3` normally (no forced/legacy-peer-deps flag needed, no hand-written SVG fallback required).
- New route `/guide/habits`: two independent chart panels, "Cleaning habits" (the 11 seeded `group='cleaning'` habits) and "My habits" (`group='custom'`, user-added). Enabled the `habits` nav entry in `lib/navGroups.ts` (it's been a disabled "Soon" placeholder since Phase 4) and added a "See your progress →" link at the top of the cleaning page.
- **How "two charts" works with a variable number of habits per group:** each panel shows one chart at a time for a *selected* habit, with a pill-row habit picker above it to switch which one. This was a judgment call — the spec describes value-type-aware rendering per habit ("boolean habits plot as completions per period," etc.), which only makes sense charting one habit at a time; aggregating, say, 11 different boolean cleaning tasks into a single combined chart isn't something one chart can do meaningfully, and the spec is explicit about "two separate charts," not "N mini-charts, one per habit." A habit-selector-driven single chart per panel satisfies both constraints at once.
- Both panels are the same `HabitChartPanel` component, parameterized by `group` and a `manageable` flag — `manageable` is only true for "My habits," since cleaning habits are system-seeded from `lib/content.ts` and editing/deleting one there would desync it from that static config.
- **Chart mechanics, per the spec's rules:**
  - Bar/line toggle is a segmented control persisted to `localStorage` per panel (`habitsChart:cleaning:chartType` / `habitsChart:custom:chartType`), via a new small `useLocalStorageState` hook. Time range (7/30/90 days) is plain in-memory state — the spec only asked for the chart-type toggle to persist.
  - All chart colors are `"var(--accent)"`, `"var(--text-secondary)"`, `"var(--border)"`, etc., passed directly as `fill`/`stroke` string props — SVG presentation attributes participate in the CSS cascade, so the browser resolves these live at paint time and they automatically track theme changes, no JS color-resolution hook needed (recharts renders plain SVG, unlike Phase 6's WebGL canvases, which is why that phase *did* need one).
  - Boolean habits never use red/green to mean "done"/"missed" — a day is either a bar of height 1 or no bar at all (height 0), so completion is encoded by presence/height, not color, sidestepping the red-green colorblindness concern entirely.
  - Axis tick labels are 12px, `var(--font)`. Bars are a single flat `var(--accent)` fill, no gradient/shadow. Lines are 2px with visible 4px dots at each point (`connectNulls={false}`, so a missing day breaks the line rather than silently averaging across it). Gridlines are horizontal-only, `var(--border)` (the same low-contrast token used for card borders throughout the app).
  - A 90-day range doesn't try to render 90 x-axis labels — `pickTickDates` (new, in `lib/habits.ts`) thins them down to at most 6, always keeping the first and last date, so nothing overlaps on a 360px screen. The chart itself sits in a `ResponsiveContainer` at `width="100%"`, so it can't overflow its card horizontally.
  - Tooltips use recharts' built-in `Tooltip`, which triggers on tap as well as hover out of the box — **flagging this as unverified**, since I have no way to test an actual touchscreen tap from this environment. Please check this specifically on a phone.
- **Empty states, per the spec ("never render an empty axis with no explanation"):** three distinct levels — no habits in a group at all (shows the "add a habit" prompt instead of a picker for "My habits"; a plain message for "Cleaning habits," which shouldn't normally happen since seeding is automatic), a habit selected but zero entries anywhere in the selected range (shows "No data yet for *habit* in the last N days. Log today below to get started." instead of the chart), and the ordinary populated case.
- **Log today row:** boolean habits are a single tap (reusing the same log/remove-entry pattern as the cleaning page's `ChecklistCard`); number and percent habits get a small text input plus a "Log" button. Logging twice on the same day corrects rather than duplicates — this was already guaranteed by Phase 7's `upsert(..., { onConflict: 'habit_id,entry_date' })` in `logHabitEntry`, nothing new needed here.
- **Add / edit / archive / delete habits:** `HabitForm` (shared between add and edit) collects name, icon (plain emoji text field, per the spec's stated fallback — no picker widget), value type (labeled "Tick-off / Number / Percentage" in the UI, mapped to `boolean`/`number`/`percent` internally), and — only for number/percent — an optional unit and target. `updateHabit` and `deleteHabit` didn't exist yet (Phase 7 only built `addHabit`/`archiveHabit`); both were added to `app/actions.ts` for this phase's "edit" and "warns first" delete requirements. Deleting shows an inline confirmation ("Delete *habit* and all of its logged history? This can't be undone.") before actually calling `deleteHabit`; archiving has no confirmation, since it's non-destructive and reversible by re-adding.
- New habits' `key` is generated from the name (slugified + a short random suffix, since `key` only needs to be unique per user, not globally meaningful) — the spec's add-habit form doesn't ask the user to type a key directly, so this seemed the least-friction way to satisfy the schema's `unique(user_id, key)` constraint without adding a field nobody asked for.
- No cadence picker in the add-habit form (the spec's field list for it doesn't mention cadence either) — custom habits default to `weekly`. This can be exposed later if wanted; for now the habits page doesn't use cadence for anything except habits that get reused by the "done within window" logic on the cleaning page, which only applies to the `cleaning` group anyway.
- Verified with `npm run build` (passes, new `/guide/habits` route present) and `npm run lint` (passes after fixing a few recharts v3 TypeScript signature mismatches in `HabitChart.tsx` — its `Tooltip` formatter/labelFormatter types are stricter about `undefined`/array cases than a straightforward function signature expects — and the same `set-state-in-effect` pattern from Phase 1's `ThemeToggle` in the new `useLocalStorageState` hook, suppressed the same way with the same justification). Smoke-tested `/guide/habits` and the cleaning page's new link with the dev server (temporary auth bypass, fully reverted after — confirmed via `git diff`): both render 200, and confirmed directly in the rendered HTML that the nav's "Habits" entry is now a real `<a href="/guide/habits">` instead of the disabled "Soon" placeholder from Phase 4.
- **What I could not verify:** the actual charts, since there's no real logged habit data in this environment to render, and no way to visually confirm the color/contrast rules hold in both themes, that tooltips actually respond to a tap (not just a mouse hover) on a real touchscreen, or that nothing overflows on an actual 360px device rather than just "should be fine per `ResponsiveContainer`" reasoning. This phase needs a real look on a real phone more than most.

**Files touched:**
- `app/guide/habits/page.tsx` (new), `app/guide/habits/data.ts` (new), `app/guide/habits/habits.module.css` (new)
- `components/HabitChartPanel.tsx` (new), `components/HabitChartPanel.module.css` (new)
- `components/HabitChart.tsx` (new)
- `components/HabitForm.tsx` (new), `components/HabitForm.module.css` (new)
- `lib/useLocalStorage.ts` (new)
- `lib/habits.ts` (added `rangeDates`, `formatShortDate`, `pickTickDates`)
- `lib/navGroups.ts` (enabled the `habits` link)
- `app/actions.ts` (added `updateHabit`, `deleteHabit`; habit actions now also revalidate `/guide/habits`)
- `app/guide/cleaning/page.tsx`, `app/guide/cleaning/cleaning.module.css` (added the "See your progress →" link)
- `package.json` / `package-lock.json` (added `recharts`)

**Anything to click:** nothing required in Vercel or Supabase — this phase only reads/writes the tables Phase 7 already created. Recommended: open `/guide/habits` on a real phone, in both light and dark mode, and add a couple of test habits (one of each type) to see the charts with real data — that's the one thing I have no way to check from here.

---

## Fix — "Couldn't load your cleaning habits" (permission denied)
**Date:** 2026-09-24

**What changed:**
- Root cause: the Phase 7 tables existed and had RLS policies, but the `authenticated` role had no table-level privileges on them, so every query failed with Postgres error 42501 ("permission denied"). RLS policies only filter rows — the role still needs `grant select, insert, update, delete` to touch the table at all, and this Supabase project doesn't add those automatically for SQL-editor-created tables.
- The debug line showed just `seed-count:` because the count query is a head-only request, which gets no response body — so the error arrived with an empty message. Added `describeError` in `app/guide/cleaning/data.ts`, which also includes the error code/details so the line is never blank.
- Appended the three `grant` statements to `supabase-schema.sql` (safe to re-run).

**Files touched:** `supabase-schema.sql`, `app/guide/cleaning/data.ts`

**Anything to click:** run the three `grant` lines in the Supabase SQL editor.

---

## Phase 8.1 — Per-habit colours + "All on one chart"
**Date:** 2026-09-24

**What changed:**
- Every habit now has its own colour, drawn from a fixed 8-colour palette (`lib/habitColors.ts`, hex values as `--habit-*` tokens in `globals.css`, with separate light/dark steps). The palette and its order were run through a colourblind-separation validator against this app's actual backgrounds (`#EBEBEB` / `#23262b`): all checks pass in both themes. Four colours sit below 3:1 contrast on the light background, which is why the combined chart always has a legend and the tooltip names each line.
- Default colours go by position in the group; new habits get the first colour not already used. Any habit, including the cleaning ones, can be recoloured from a "Colour" row under its chart. Saved in a new nullable `habits.color` column.
- New "All on one chart" option in each panel's picker: one line per habit, with legend chips to turn lines on/off. Rules:
  - Habits only share a chart if they share a y-axis (no dual-axis charts), so the combined view groups by measure: tick-offs, percentages, or numbers per unit (km and minutes never mix). A switcher appears when a panel has more than one kind.
  - Tick-off habits plot as a running total of times done in the range (stepped lines), since overlapping 0/1 lines would be unreadable.
  - Max 8 lines at once (the palette size). The cleaning group has 11 habits, so the last 3 start switched off, and habits 9–11 repeat colours 1–3 by default until recoloured.
  - Combined view is line-only; logging and recolouring happen in the single-habit view.
- The page and "add habit" keep working before the SQL below is run (they fall back to default colours on Postgres error 42703); only saving a colour change needs it.
- Verified with `npm run build`, `tsc`, lint, and headless-Chrome screenshots of a temporary sample-data page at 390px in both themes (page deleted afterwards).

**Files touched:** `lib/habitColors.ts` (new), `app/globals.css`, `components/HabitChart.tsx`, `components/HabitChartPanel.tsx`, `components/HabitChartPanel.module.css`, `app/guide/habits/data.ts`, `app/actions.ts`, `supabase-schema.sql`

**Anything to click:** run `alter table habits add column if not exists color text;` in the Supabase SQL editor.
