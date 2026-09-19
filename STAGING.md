# Staging Setup (plain English)

## The two branches

- **`main`** — this is the **live site**. Whatever is on `main` is what visitors see at the real, public URL.
- **`redesign`** — this is the **staging branch**. It's a safe place to make and test changes before they go live. Nothing pushed to `redesign` ever appears on the live site by itself.

## How staging shows up

Every time new work is pushed to the `redesign` branch, Vercel automatically builds it and publishes it to its own **preview URL** (a separate link that looks something like `alexis-guide-git-redesign-<your-vercel-account>.vercel.app`). You can open that link any time to see exactly what's on `redesign`, without it affecting the live site at all.

Vercel posts/updates this preview URL automatically — check the **Deployments** tab in the Vercel dashboard, or a GitHub pull request if one is open for `redesign`, to find the link.

## Everyday commands

### (a) Push new work to staging

Make your changes, then run:

```
git add .
git commit -m "describe what you changed"
git push
```

(As long as you're on the `redesign` branch — check with `git branch --show-current` — `git push` sends the update to staging and Vercel will publish a fresh preview automatically.)

### (b) Merge staging into live (once you're happy with it)

```
git checkout main
git pull
git merge redesign
git push
```

This takes everything that's been tested on staging and makes it the new live site. Vercel will automatically build and publish `main` after this push.

## One important note

Both `main` and `redesign` currently point at the **same Supabase database** (project `rxbmgdcicgozvtzihwse`). That means: testing on staging is safe for *code/design* changes, but any data changes (new rows, deleted rows, schema edits) affect the real database used by the live site too. If we ever need a fully separate testing database, that requires creating a second Supabase project — ask before doing anything that writes/deletes real data while testing on staging.
