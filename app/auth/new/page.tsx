'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { checkEmailAllowed } from '@/app/auth/actions'
import { humanizeAuthError } from '@/lib/authErrors'
import styles from '../auth.module.css'

export default function CreateAccountPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { allowed, message } = await checkEmailAllowed(email)
    if (!allowed) {
      setError(message ?? "That email isn't on the list yet.")
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=/auth/set-password`,
      },
    })
    if (error) {
      setError(humanizeAuthError(error.message))
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Create your account</p>
          <h1 className={styles.title}>Welcome</h1>
          <p className={styles.subtitle}>We’ll send you a link to get started and set a password.</p>
        </div>

        {sent ? (
          <div className={styles.sent}>
            <span className={styles.sentIcon}>✉️</span>
            <p className={styles.sentText}>Check your inbox — a link is on its way to <strong>{email}</strong></p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.label} htmlFor="email">Email</label>
            <div className={`${styles.inputWrap} pressed`}>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="alexis@example.com"
                required
                className={styles.input}
              />
            </div>

            <button type="submit" disabled={loading} className={`${styles.btn} raised`}>
              {loading ? 'Sending…' : 'Send link'}
            </button>

            {error && <p className={styles.error}>{error}</p>}
          </form>
        )}

        <div className={styles.links}>
          <Link href="/login" className={styles.link}>Already have an account? Sign in</Link>
        </div>
      </div>
    </div>
  )
}
