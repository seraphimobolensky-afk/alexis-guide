'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { checkEmailAllowed } from '@/app/auth/actions'
import { humanizeAuthError } from '@/lib/authErrors'
import AuthShell from '@/components/AuthShell'
import AuthSubmitButton from '@/components/AuthSubmitButton'
import styles from './login.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
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

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(humanizeAuthError(error.message))
      setLoading(false)
      return
    }

    router.push('/guide/welcome')
    router.refresh()
  }

  return (
    <AuthShell warpText="Hi Lesch! Are you ready?">
      <div className={styles.header}>
        <p className={styles.eyebrow}>A guide to living alone</p>
        <h1 className={styles.title}>Hey Alexis</h1>
        <p className={styles.subtitle}>Sign in to keep going.</p>
      </div>

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

        <label className={styles.label} htmlFor="password">Password</label>
        <div className={`${styles.inputWrap} pressed ${styles.passwordWrap}`}>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className={styles.input}
          />
          <button
            type="button"
            onClick={() => setShowPassword(s => !s)}
            className={styles.toggleVisibility}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <AuthSubmitButton disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </AuthSubmitButton>

        {error && <p className={styles.error}>{error}</p>}
      </form>

      <div className={styles.links}>
        <Link href="/auth/reset" className={styles.link}>Forgot password?</Link>
        <Link href="/auth/new" className={styles.link}>New here? Create your account</Link>
      </div>

      <p className={styles.from}>From Sera, with ♡</p>
    </AuthShell>
  )
}
