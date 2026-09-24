# Alexis's Guide

A personal guide to living alone, written by Sera for Alexis. Built with Next.js 16, React 19, CSS Modules and Supabase, deployed on Vercel.

---

## What's in it

- **The guide**: nine content sections (cleaning, materials, appliances, groceries, recipes, roommates, life, uni, plus a welcome letter), with collapsible cards. Content lives in `lib/content.ts`, transcribed word for word from the original PDF.
- **Cleaning checklist**: each task shows whether it's done within its own schedule (weekly / bi-weekly / monthly / as needed) and when it was last done. Ticking a task logs a dated entry, so it resets on its own.
- **Habits** (`/guide/habits`): charts for the cleaning tasks plus any custom habits (tick-off, number or percentage), one habit at a time or all on one chart, each with its own colour.
- **Grocery list** (`/guide/grocery-list`): type an item and it's sorted into an aisle automatically by an offline keyword lookup (`lib/groceryCategories.ts`, no AI or network). Tick items off into a "Bought" history. Manual category moves are remembered.
- Light/dark theme (follows the device, with a toggle), mobile-first layout, reduced-motion support.

## How sign-in works

- **Email + password.** New accounts go through "Create your account" (`/auth/new`): Supabase emails a one-time link, which lands on `/auth/set-password`. "Forgot password?" (`/auth/reset`) works the same way.
- **Invite-only.** Only emails listed in `ALLOWED_EMAILS` can use the guide. The login and sign-up pages check the list as a friendly early warning, but the real check is on the server: `app/guide/layout.tsx` sends any signed-in user whose email isn't on the list to `/auth/not-invited`, which signs them out. If `ALLOWED_EMAILS` is empty or missing, nobody gets in (fails closed).
- **Page protection** is in `app/guide/layout.tsx` (there is no middleware): signed-out visitors to any `/guide/*` page are redirected to `/login`.
- Every table has row-level security: each user can only read and write their own rows.

---

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query**: paste all of `supabase-schema.sql` and run it. It's safe to re-run. It creates:
   - `habits`, `habit_entries`: habit tracking (the 11 cleaning tasks are added automatically for each user the first time they open the cleaning page)
   - `grocery_items`, `grocery_category_overrides`: the grocery list and remembered category moves
   - `checklist_completions`: old, no longer used, kept so no data is lost
   - the row-level security policies and table grants for all of them
3. **Authentication → Providers**: Email enabled.
4. **Authentication → URL Configuration**: set the Site URL to the live URL, and add both the live and staging URLs to Redirect URLs (e.g. `https://your-app.vercel.app/**`), otherwise sign-up and reset links won't work there.
5. Copy the project URL and anon key from **Project Settings → API**.

### 2. Environment variables

In `.env.local` (git-ignored, never committed) and in Vercel (**Settings → Environment Variables**, for both Production and Preview):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ALLOWED_EMAILS=alexis@example.com,sera@example.com
```

`ALLOWED_EMAILS` is comma-separated and case-insensitive. It has no `NEXT_PUBLIC_` prefix, so it's only ever read on the server and never sent to the browser.

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Before calling any change done: `npm run build` and `npm run lint` must both pass.

---

## Branches, staging and going live

- **`main`** is the live site. Vercel deploys every push to `main` to production.
- **`redesign`** (or any other branch) is staging. Every push gets its own Vercel preview URL; `redesign`'s stable one is `alexis-guide-git-redesign-seraphim-s-projects2.vercel.app`.
- Work on a branch, check it on the preview URL, then merge into `main` to go live. Step-by-step commands are in `STAGING.md`.
- **Staging and live share the same Supabase project**, so database changes (running SQL, deleting rows) affect the live site immediately, even when you're "only" testing on staging.

## Project notes

- Styling is CSS Modules + CSS variables (theme tokens in `app/globals.css`). Tailwind isn't used; don't add it, and don't run `npx shadcn init`.
- `PHASE-LOG.md` records what changed in each phase of the rebuild and why.
