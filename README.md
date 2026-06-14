# Alexis's Guide

A personal guide to living alone — built with Next.js, Supabase, and deployed on Vercel.

---

## Setup

### 1. Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the SQL editor, paste and run the contents of `supabase-schema.sql`.
3. In **Authentication → Providers**, make sure **Email** is enabled with "Magic Links" turned on.
4. In **Authentication → URL Configuration**, add your Vercel URL to "Redirect URLs" (e.g. `https://your-app.vercel.app/**`).
5. Copy your project URL and anon key from **Project Settings → API**.

### 2. Environment variables

Create a `.env.local` file (already in the repo as a template):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project settings.
4. Deploy. Done.

Every push to `main` will auto-deploy.

---

## How it works

- Alexis visits the URL and enters his email → receives a magic link → logs in.
- He can read all 8 sections of the guide from the sidebar.
- In the **Cleaning** section, he can tick off tasks as he completes them — progress is saved to Supabase and persists across sessions.
- Middleware protects all `/guide/*` routes — unauthenticated visitors are redirected to `/login`.
