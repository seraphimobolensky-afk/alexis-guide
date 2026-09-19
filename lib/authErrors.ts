// Client-safe: pure string mapping, no env access. Turns raw Supabase auth
// error text into something a non-technical person can actually act on.
export function humanizeAuthError(message: string): string {
  const msg = message.toLowerCase()

  if (msg.includes('invalid login credentials')) {
    return 'That email and password don’t match what we have. If you haven’t set a password yet, use "Create your account" below, or reset your password.'
  }
  if (msg.includes('rate limit') || msg.includes('too many')) {
    return 'Too many attempts. Please wait a few minutes and try again.'
  }
  if (msg.includes('email not confirmed')) {
    return 'Please confirm your email first — check your inbox for a link.'
  }
  if (msg.includes('password') && (msg.includes('character') || msg.includes('short') || msg.includes('at least'))) {
    return 'Password must be at least 8 characters.'
  }
  if (msg.includes('user not found')) {
    return 'We couldn’t find an account for that email.'
  }

  return 'Something went wrong. Please try again in a moment.'
}
