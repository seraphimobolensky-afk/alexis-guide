'use client'
import { useEffect, useState } from 'react'

/** Persists a simple string-ish value to localStorage, per-key. Starts at
 * `initial` on both server and first client render (no hydration mismatch),
 * then syncs from storage right after mount. */
export function useLocalStorageState<T extends string>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initial)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setValue(stored as T)
    } catch {}
  }, [key])

  function update(next: T) {
    setValue(next)
    try {
      localStorage.setItem(key, next)
    } catch {}
  }

  return [value, update]
}
