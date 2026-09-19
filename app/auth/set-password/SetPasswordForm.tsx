'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { humanizeAuthError } from '@/lib/authErrors'
import AuthShell from '@/components/AuthShell'
import AuthSubmitButton from '@/components/AuthSubmitButton'
import styles from '../auth.module.css'

export default function SetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError("Those passwords don't match.")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(humanizeAuthError(error.message))
      setLoading(false)
      return
    }

    router.push('/guide/welcome')
    router.refresh()
  }

  return (
    <AuthShell warpText="Set a password">
      <div className={styles.header}>
        <p className={styles.eyebrow}>Almost there</p>
        <h1 className={styles.title}>Set a password</h1>
        <p className={styles.subtitle}>Pick a password so you can sign in directly next time.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label} htmlFor="password">New password</label>
        <div className={`${styles.inputWrap} pressed ${styles.passwordWrap}`}>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
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
        <p className={styles.hint}>At least 8 characters.</p>

        <label className={styles.label} htmlFor="confirm">Confirm password</label>
        <div className={`${styles.inputWrap} pressed`}>
          <input
            id="confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            minLength={8}
            className={styles.input}
          />
        </div>

        <AuthSubmitButton disabled={loading}>
          {loading ? 'Saving…' : 'Save password'}
        </AuthSubmitButton>

        {error && <p className={styles.error}>{error}</p>}
      </form>
    </AuthShell>
  )
}
