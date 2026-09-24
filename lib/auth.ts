// Server-only: reads ALLOWED_EMAILS (no NEXT_PUBLIC_ prefix, never bundled
// client-side). Only import this from server files — app/auth/actions.ts and
// app/guide/layout.tsx.

export function getAllowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isEmailAllowed(email: string): boolean {
  const allowed = getAllowedEmails()
  // Fail closed: an empty/missing list means nobody gets in, rather than
  // silently letting everyone through if the env var isn't configured.
  if (allowed.length === 0) return false
  return allowed.includes(email.trim().toLowerCase())
}
