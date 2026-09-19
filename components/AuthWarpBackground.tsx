'use client'
import { useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import { useResolvedCssVar } from '@/lib/useThemeColor'
import WebglErrorBoundary from './WebglErrorBoundary'
import styles from './AuthWarpBackground.module.css'

const WarpText = dynamic(() => import('./WarpText'), { ssr: false })

export default function AuthWarpBackground({ text }: { text: string }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const handleStatus = useCallback((s: 'ready' | 'error') => setStatus(s), [])
  const textColor = useResolvedCssVar('--text-primary', '#2b2b2a')

  // Purely decorative — the same copy already appears as a real heading in
  // the card, so screen readers get it there and don't need it announced
  // twice (as an image label, or as this fallback text) from behind it.
  return (
    <div className={styles.background} aria-hidden="true">
      <div className={styles.gradient} />
      {status !== 'ready' && <div className={styles.fallbackText}>{text}</div>}
      <WebglErrorBoundary fallback={null}>
        <WarpText
          text={text}
          color={textColor}
          className={styles.canvasLayer}
          style={{ position: 'absolute', inset: 0 }}
          onStatusChange={handleStatus}
        />
      </WebglErrorBoundary>
    </div>
  )
}
