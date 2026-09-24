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
  // Supabase's per-address cooldown: "For security purposes, you can only
  // request this after 42 seconds." (doesn't contain "rate limit").
  if (msg.includes('only request this after')) {
    const seconds = message.match(/after (\d+) seconds?/i)?.[1]
    return seconds
      ? `Please wait ${seconds} seconds before asking for another link.`
      : 'Please wait a minute before asking for another link.'
  }
  // Supabase's built-in email service only delivers to the project's own
  // team members; any other address needs custom SMTP configured.
  if (msg.includes('not authorized') || msg.includes('error sending')) {
    return 'The email couldn’t be sent to that address — the email service isn’t set up for it yet. Please let Sera know.'
  }

  // Anything unrecognised: show Supabase's own wording so it can actually be
  // diagnosed, rather than a generic message that hides the cause.
  return `Something went wrong: ${message}`
}
