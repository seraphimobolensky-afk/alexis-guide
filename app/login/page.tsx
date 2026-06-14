'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './login.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>A guide to living alone</p>
          <h1 className={styles.title}>Hey Alexis</h1>
          <p className={styles.subtitle}>
            This is your guide — for whenever you need it.
          </p>
        </div>

        {sent ? (
          <div className={styles.sent}>
            <span className={styles.sentIcon}>✉️</span>
            <p className={styles.sentText}>Check your inbox — magic link sent to <strong>{email}</strong></p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.label}>Your email</label>
            <div className={`${styles.inputWrap} pressed`}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="alexis@example.com"
                required
                className={styles.input}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`${styles.btn} raised`}
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}

        <p className={styles.from}>From Sera, with ♡</p>
      </div>
    </div>
  )
}
