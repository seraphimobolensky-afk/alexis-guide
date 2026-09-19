import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function safeNext(raw: string | null): string {
  // Only allow a same-site relative path — never an absolute/external URL
  // (and never a protocol-relative "//evil.com" one either).
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) {
    return raw
  }
  return '/guide/welcome'
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
