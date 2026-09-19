'use server'
import { isEmailAllowed } from '@/lib/auth'

export async function checkEmailAllowed(email: string): Promise<{ allowed: boolean; message?: string }> {
  if (isEmailAllowed(email)) {
    return { allowed: true }
  }
  return {
    allowed: false,
    message: "This guide is invite-only right now — that email isn't on the list yet.",
  }
}
