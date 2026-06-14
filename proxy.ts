import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for any Supabase auth cookie (format: sb-*-auth-token)
  const hasSession = request.cookies.getAll().some(c => c.name.includes('-auth-token'))

  if (!hasSession && pathname !== '/login' && !pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (hasSession && pathname === '/login') {
    return NextResponse.redirect(new URL('/guide/cleaning', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
