'use client'
import { useMemo, useOptimistic, useRef, useState, useTransition } from 'react'
import {
  addGroceryItem,
  toggleGroceryPurchased,
  clearPurchasedGroceries,
  setGroceryCategory,
  removeGroceryItem,
} from '@/app/actions'
import {
  GROCERY_CATEGORIES,
  categorizeGrocery,
  isGroceryCategory,
  normalizeGroceryName,
  parseGroceryInput,
  type GroceryCategory,
} from '@/lib/groceryCategories'
import type { GroceryItem } from '@/app/guide/grocery-list/data'
import styles from './GroceryList.module.css'

interface Props {
  items: GroceryItem[]
  overrides: Record<string, string>
}

type OptimisticAction =
  | { type: 'add'; item: GroceryItem }
  | { type: 'purchase'; id: string; purchased: boolean; at: string }
  | { type: 'category'; id: string; category: GroceryCategory }
  | { type: 'remove'; id: string }
  | { type: 'clearBought' }

function applyAction(items: GroceryItem[], action: OptimisticAction): GroceryItem[] {
  switch (action.type) {
    case 'add':
      return [...items, action.item]
    case 'purchase':
      return items.map(i =>
        i.id === action.id ? { ...i, purchased: action.purchased, purchasedAt: action.purchased ? action.at : null } : i
      )
    case 'category':
      return items.map(i => (i.id === action.id ? { ...i, category: action.category } : i))
    case 'remove':
      return items.filter(i => i.id !== action.id)
    case 'clearBought':
      return items.filter(i => !i.purchased)
  }
}

/** How long a ticked row plays its "leaving" animation before it moves to Bought. */
const LEAVE_MS = 220

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function GroceryList({ items, overrides }: Props) {
  const [optimisticItems, applyOptimistic] = useOptimistic(items, applyAction)
  const [, startTransition] = useTransition()
  const [input, setInput] = useState('')
  // Category moves made this session, so a re-add before the server
  // round-trip finishes already lands in the corrected category.
  const [localOverrides, setLocalOverrides] = useState<Record<string, string>>({})
  const [leavingIds, setLeavingIds] = useState<Set<string>>(() => new Set())
  // Only rows ticked this session animate into Bought — not the whole
  // history on every page load.
  const [justBoughtIds, setJustBoughtIds] = useState<Set<string>>(() => new Set())
  const [menuId, setMenuId] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const allOverrides = useMemo(() => ({ ...overrides, ...localOverrides }), [overrides, localOverrides])

  const toBuy = optimisticItems.filter(i => !i.purchased)
  const bought = optimisticItems
    .filter(i => i.purchased)
    .sort((a, b) => (b.purchasedAt ?? '').localeCompare(a.purchasedAt ?? ''))

  const groups = useMemo(() => {
    const byCategory = new Map<GroceryCategory, GroceryItem[]>()
    for (const item of toBuy) {
      const category = isGroceryCategory(item.category) ? item.category : categorizeGrocery(item.name, allOverrides)
      byCategory.set(category, [...(byCategory.get(category) ?? []), item])
    }
    // GROCERY_CATEGORIES is already in shopping order: Produce first, Household last.
    return GROCERY_CATEGORIES.filter(c => byCategory.has(c)).map(c => ({ category: c, items: byCategory.get(c)! }))
  }, [toBuy, allOverrides])

  /** Run a save with an optimistic update; if it fails, the update rolls back and we say why. */
  function save(action: OptimisticAction, run: () => Promise<{ error?: string }>, failMessage: string) {
    setError('')
    startTransition(async () => {
      applyOptimistic(action)
      try {
        const res = await run()
        if (res.error) setError(`${failMessage} (${res.error})`)
      } catch {
        setError(`${failMessage} The save didn’t go through — try again.`)
      }
    })
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const { name, quantity } = parseGroceryInput(input)
    if (!name) return
    const category = categorizeGrocery(name, allOverrides)
    const now = new Date().toISOString()
    setInput('')
    inputRef.current?.focus()
    save(
      {
        type: 'add',
        item: { id: `temp-${now}-${Math.random()}`, name, category, quantity, purchased: false, purchasedAt: null, createdAt: now },
      },
      () => addGroceryItem({ name, category, quantity: quantity ?? undefined }),
      `Couldn’t save “${name}”, so it was taken off the list again.`
    )
  }

  function handleTick(item: GroceryItem) {
    if (item.id.startsWith('temp-') || leavingIds.has(item.id)) return
    const commit = () => {
      setJustBoughtIds(prev => new Set(prev).add(item.id))
      save(
        { type: 'purchase', id: item.id, purchased: true, at: new Date().toISOString() },
        () => toggleGroceryPurchased(item.id, true),
        `Couldn’t tick off “${item.name}”, so it was put back on the list.`
      )
    }
    if (prefersReducedMotion()) return commit()

    // Let the row play its strike-and-fade first, then move it to Bought.
    setLeavingIds(prev => new Set(prev).add(item.id))
    setTimeout(() => {
      commit()
      setLeavingIds(prev => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
    }, LEAVE_MS)
  }

  function handleReAdd(item: GroceryItem) {
    save(
      { type: 'purchase', id: item.id, purchased: false, at: '' },
      () => toggleGroceryPurchased(item.id, false),
      `Couldn’t add “${item.name}” back to the list.`
    )
  }

  function handleMove(item: GroceryItem, category: GroceryCategory) {
    setMenuId(null)
    setLocalOverrides(prev => ({ ...prev, [normalizeGroceryName(item.name)]: category }))
    save(
      { type: 'category', id: item.id, category },
      () => setGroceryCategory(item.id, item.name, category),
      `Couldn’t move “${item.name}”.`
    )
  }

  function handleRemove(item: GroceryItem) {
    setMenuId(null)
    save({ type: 'remove', id: item.id }, () => removeGroceryItem(item.id), `Couldn’t remove “${item.name}”.`)
  }

  function handleClearHistory() {
    setConfirmClear(false)
    save({ type: 'clearBought' }, () => clearPurchasedGroceries(), 'Couldn’t clear the history.')
  }

  return (
    <div className={styles.root}>
      <form onSubmit={handleAdd} className={styles.inputBar}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add an item, e.g. 2 kg rice"
          aria-label="Add an item"
          enterKeyHint="done"
          autoComplete="off"
          autoCapitalize="none"
          className={`${styles.input} pressed`}
        />
        <button type="submit" disabled={!input.trim()} className={`${styles.addButton} raised-sm`}>
          Add
        </button>
      </form>

      {error && (
        <div role="alert" className={styles.error}>
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className={styles.errorDismiss} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      <p className={styles.total} aria-live="polite">
        {toBuy.length === 0
          ? 'Your list is empty.'
          : `${toBuy.length} ${toBuy.length === 1 ? 'item' : 'items'} to buy`}
      </p>

      {groups.map(({ category, items: groupItems }) => (
        <section key={category} className={styles.group}>
          <h3 className={styles.groupHeading}>
            {category} <span className={styles.count}>{groupItems.length}</span>
          </h3>
          <ul className={`${styles.list} raised`}>
            {groupItems.map(item => {
              const leaving = leavingIds.has(item.id)
              const menuOpen = menuId === item.id
              return (
                <li key={item.id} className={`${styles.row} ${leaving ? styles.rowLeaving : ''}`}>
                  <div className={styles.rowMain}>
                    <button
                      type="button"
                      onClick={() => handleTick(item)}
                      className={styles.tickArea}
                      aria-label={`Tick off ${item.name}`}
                    >
                      <span className={`${styles.checkbox} ${leaving ? styles.checkboxOn : ''}`} aria-hidden>
                        {leaving ? '✓' : ''}
                      </span>
                      <span className={styles.itemName}>{item.name}</span>
                      {item.quantity && <span className={styles.quantity}>{item.quantity}</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMenuId(menuOpen ? null : item.id)}
                      aria-expanded={menuOpen}
                      aria-label={`More options for ${item.name}`}
                      className={styles.menuButton}
                    >
                      ⋯
                    </button>
                  </div>
                  {menuOpen && (
                    <div className={styles.menu}>
                      <p className={styles.menuLabel}>Move to</p>
                      <div className={styles.menuChips}>
                        {GROCERY_CATEGORIES.filter(c => c !== category).map(c => (
                          <button key={c} type="button" onClick={() => handleMove(item, c)} className={`${styles.chip} raised-sm`}>
                            {c}
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={() => handleRemove(item)} className={styles.removeButton}>
                        Remove from list
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      {bought.length > 0 && (
        <section className={styles.boughtSection}>
          <div className={styles.boughtHeader}>
            <h3 className={styles.groupHeading}>
              Bought <span className={styles.count}>{bought.length}</span>
            </h3>
            {!confirmClear && (
              <button type="button" onClick={() => setConfirmClear(true)} className={styles.clearButton}>
                Clear history
              </button>
            )}
          </div>
          {confirmClear && (
            <div className={styles.confirm}>
              <p>Clear all {bought.length} bought items? They won’t be available to re-add any more.</p>
              <div className={styles.confirmActions}>
                <button type="button" onClick={() => setConfirmClear(false)} className={styles.clearButton}>
                  Cancel
                </button>
                <button type="button" onClick={handleClearHistory} className={styles.confirmDanger}>
                  Yes, clear it
                </button>
              </div>
            </div>
          )}
          <p className={styles.hint}>Tap an item to put it back on the list.</p>
          <ul className={`${styles.list} ${styles.boughtList} raised`}>
            {bought.map(item => (
              <li key={item.id} className={`${styles.row} ${justBoughtIds.has(item.id) ? styles.rowEntering : ''}`}>
                <button
                  type="button"
                  onClick={() => handleReAdd(item)}
                  className={styles.tickArea}
                  aria-label={`Add ${item.name} back to the list`}
                >
                  <span className={`${styles.checkbox} ${styles.checkboxOn}`} aria-hidden>
                    ✓
                  </span>
                  <span className={`${styles.itemName} ${styles.struck}`}>{item.name}</span>
                  {item.quantity && <span className={`${styles.quantity} ${styles.struck}`}>{item.quantity}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
