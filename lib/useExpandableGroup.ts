'use client'
import { useCallback, useState } from 'react'

export function useExpandableGroup(ids: string[]) {
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const isOpen = useCallback((id: string) => !!open[id], [open])

  const toggle = useCallback((id: string) => {
    setOpen(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const expandAll = useCallback(() => {
    setOpen(Object.fromEntries(ids.map(id => [id, true])))
  }, [ids])

  const collapseAll = useCallback(() => setOpen({}), [])

  const allOpen = ids.length > 0 && ids.every(id => open[id])

  return { isOpen, toggle, expandAll, collapseAll, allOpen }
}
