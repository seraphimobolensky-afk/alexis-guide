import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Reached from app/guide/layout.tsx when a signed-in user's email isn't on
// ALLOWED_EMAILS. The login/sign-up pages check the list too, but only as a
// friendly pre-check — Supabase's browser key is public, so an account could
// be created without going through those pages. This is where it's enforced.
// A route handler (not the layout) because only these can clear cookies.
export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(`${origin}/login?error=not-invited`)
}
