'use client'
import { useCallback, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { useResolvedCssVar } from '@/lib/useThemeColor'
import WebglErrorBoundary from './WebglErrorBoundary'
import styles from './AuthSubmitButton.module.css'

const SpecularButton = dynamic(() => import('./SpecularButton'), { ssr: false })

interface Props {
  children: ReactNode
  disabled?: boolean
}

function PlainFallback({ children, disabled }: Props) {
  return (
    <button type="submit" disabled={disabled} className={`${styles.fallback} raised`}>
      {children}
    </button>
  )
}

export default function AuthSubmitButton({ children, disabled }: Props) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const handleStatus = useCallback((s: 'ready' | 'error') => setStatus(s), [])

  const lineColor = useResolvedCssVar('--accent', '#9c4a34')
  const baseColor = useResolvedCssVar('--text-muted', '#676767')
  const textColor = useResolvedCssVar('--text-primary', '#2b2b2a')

  // A real, working <button type="submit"> is present from the very first
  // paint (this needs no client JS at all) and stays in the DOM the whole
  // time — only display:none'd once the specular version is confirmed
  // ready, and brought straight back the moment WebGL fails or errors.
  // That's what "the form must remain fully usable with zero WebGL" means
  // in practice: never a gap where no submit control exists.
  return (
    <div className={styles.wrap}>
      <div className={status === 'ready' ? styles.hidden : undefined}>
        <PlainFallback disabled={disabled}>{children}</PlainFallback>
      </div>
      <WebglErrorBoundary fallback={null}>
        <div className={status === 'ready' ? undefined : styles.hidden}>
          <SpecularButton
            type="submit"
            disabled={disabled}
            size="lg"
            lineColor={lineColor}
            baseColor={baseColor}
            textColor={textColor}
            followMouse
            proximity={220}
            className={styles.button}
            onStatusChange={handleStatus}
          >
            {children}
          </SpecularButton>
        </div>
      </WebglErrorBoundary>
    </div>
  )
}
