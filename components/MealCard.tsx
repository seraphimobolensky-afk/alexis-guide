'use client'
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Meal } from '@/app/guide/meal-planner/data'
import { ingredientsTakenOff, type GroceryChoice, type MealInput } from '@/lib/mealGroceryRules'
import { normalizeGroceryName, parseGroceryInput } from '@/lib/groceryCategories'
import {
  MEAL_SLOTS,
  MEAL_SLOT_LABELS,
  addDays,
  formatDayLong,
  isDateString,
  type MealSlot,
} from '@/lib/mealPlan'
import { findRecipe, recipeIngredients, recipeMealName, suggestRecipes } from '@/lib/mealRecipes'
import type { Recipe } from '@/lib/content'
import styles from './MealCard.module.css'

export type SaveResult = { meal?: Meal; error?: string }
export type CopyResult = { error?: string; conflict?: { name: string } }

interface Props {
  date: string
  slot: MealSlot
  today: string
  /** The meal already in this slot, if any. */
  meal: Meal | undefined
  /** Saves optimistically; the promise settles once the server has answered. */
  onSave: (input: MealInput) => Promise<SaveResult>
  onDelete: (meal: { id: string; date: string; slot: MealSlot; name: string }, groceryChoice: GroceryChoice) => void
  onCopy: (input: { fromId: string; toDate: string; toSlot: MealSlot; replace: boolean }) => Promise<CopyResult>
  /** Called once the dialog has closed, however it closed. */
  onClosed: () => void
}

interface DraftIngredient {
  /** Stable React key; `id` is the database id once saved. */
  key: string
  id?: string
  name: string
  quantity: string
  addToGroceries: boolean
  /** "Add again": put it back on the list after its grocery row was removed by hand. */
  relink?: boolean
}

/** An ingredient as last saved, with its grocery link. */
type SavedIngredient = Meal['ingredients'][number]

interface Draft {
  name: string
  notes: string
  recipeKey: string | null
  ingredients: DraftIngredient[]
}

type Confirm =
  | { type: 'recipe'; recipe: Recipe; count: number }
  /** Deleting the meal (or closing it with everything cleared); `names` are grocery rows it still feeds. */
  | { type: 'delete' | 'emptyName'; names: string[] }
  /** An edit takes ingredients off that are still on the grocery list: keep or remove them? */
  | { type: 'grocery'; names: string[]; resolve: (choice: GroceryChoice | null) => void }
  | null

type CopyState =
  | { status: 'idle' }
  | { status: 'busy' }
  | { status: 'conflict'; name: string }
  | { status: 'done' | 'error'; message: string }

let keySeq = 0
const newKey = () => `ing-${++keySeq}`

function draftFromMeal(meal: Meal | undefined): Draft {
  return {
    name: meal?.name ?? '',
    notes: meal?.notes ?? '',
    recipeKey: meal?.recipeKey ?? null,
    ingredients: (meal?.ingredients ?? []).map(i => ({
      key: newKey(),
      id: i.id,
      name: i.name,
      quantity: i.quantity ?? '',
      addToGroceries: i.addToGroceries,
    })),
  }
}

/** Trimmed, with empty ingredient rows dropped: what would actually be saved. */
function cleanDraft(draft: Draft): Draft {
  return {
    name: draft.name.trim(),
    notes: draft.notes.trim(),
    recipeKey: draft.recipeKey,
    ingredients: draft.ingredients
      .map(i => ({ ...i, name: i.name.trim(), quantity: i.quantity.trim() }))
      .filter(i => i.name),
  }
}

/** Compares content only (not ids or keys), to tell whether anything changed. */
function fingerprint(draft: Draft): string {
  const d = cleanDraft(draft)
  return JSON.stringify([d.name, d.notes, d.recipeKey, d.ingredients.map(i => [i.name, i.quantity, i.addToGroceries, !!i.relink])])
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

export default function MealCard({ date, slot, today, meal, onSave, onDelete, onCopy, onClosed }: Props) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const ingredientInputRef = useRef<HTMLInputElement>(null)
  const allToggleRef = useRef<HTMLInputElement>(null)
  const pointerDownOutside = useRef(false)
  /** Set when this component closes the dialog itself, vs. the browser closing it. */
  const closingOnPurpose = useRef(false)
  const titleId = useId()
  const listboxId = useId()

  const isPast = date < today
  const [draft, setDraft] = useState<Draft>(() => draftFromMeal(meal))
  const [baseline, setBaseline] = useState(() => fingerprint(draftFromMeal(meal)))
  const [savedId, setSavedId] = useState(meal?.id && !meal.id.startsWith('temp-') ? meal.id : null)
  const [savedName, setSavedName] = useState(meal?.name ?? '')
  /** The ingredients as last saved, with their grocery links: what an edit could take off the list. */
  const [saved, setSaved] = useState<SavedIngredient[]>(meal?.ingredients ?? [])
  const [ingredientInput, setIngredientInput] = useState('')
  const [nameMessage, setNameMessage] = useState(false)
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [copyOpen, setCopyOpen] = useState(false)
  const [copyDate, setCopyDate] = useState(() => addDays(date, 1))
  const [copySlot, setCopySlot] = useState<MealSlot>(slot)
  const [copyState, setCopyState] = useState<CopyState>({ status: 'idle' })
  /** Which ingredient field is being edited inline, if any. */
  const [editing, setEditing] = useState<{ key: string; field: 'name' | 'quantity' } | null>(null)
  // The full hint doesn't fit a phone-width input; the label still says what the field is for.
  const [narrow] = useState(() => window.matchMedia('(max-width: 479px)').matches)

  const dirty = fingerprint(draft) !== baseline
  const recipe = findRecipe(draft.recipeKey)
  // Nothing to suggest when the name already is the recipe that was picked.
  const suggestions = useMemo(
    () => suggestRecipes(draft.name).filter(r => !(r.key === draft.recipeKey && normalizeGroceryName(draft.name) === normalizeGroceryName(recipeMealName(r)))),
    [draft.name, draft.recipeKey]
  )
  const showSuggestions = suggestOpen && suggestions.length > 0
  const tickedCount = draft.ingredients.filter(i => i.addToGroceries).length
  const allTicked = draft.ingredients.length > 0 && tickedCount === draft.ingredients.length

  // Open as a modal (focus trap + Escape for free), focus the name field,
  // and keep the page behind from scrolling while it's open.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    nameRef.current?.focus()
    const root = document.documentElement
    const previousOverflow = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previousOverflow
    }
  }, [])

  // iOS keeps fixed elements under the on-screen keyboard; follow the visual
  // viewport so the bottom sheet sits above it and scrolls inside.
  useEffect(() => {
    const dialog = dialogRef.current
    const vv = window.visualViewport
    if (!dialog || !vv) return
    const update = () => {
      dialog.style.setProperty('--vv-height', `${vv.height}px`)
      dialog.style.setProperty('--vv-bottom', `${Math.max(0, window.innerHeight - vv.height - vv.offsetTop)}px`)
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  useLayoutEffect(() => {
    if (allToggleRef.current) allToggleRef.current.indeterminate = tickedCount > 0 && !allTicked
  }, [tickedCount, allTicked])

  // Notes grow with their content.
  useLayoutEffect(() => {
    const el = notesRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [draft.notes])

  function toInput(clean: Draft): MealInput {
    return {
      id: savedId ?? undefined,
      date,
      slot,
      name: clean.name,
      notes: clean.notes || null,
      recipeKey: clean.recipeKey,
      ingredients: clean.ingredients.map((i, index) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity || null,
        addToGroceries: i.addToGroceries,
        sortOrder: index,
        relink: i.relink,
      })),
    }
  }

  /** Grocery rows (still to buy) that would lose this meal's share. Bought rows don't count: they're history. */
  function stillOnList(ingredients: SavedIngredient[]): string[] {
    const names = ingredients.filter(i => i.groceryItemId && i.grocery && !i.grocery.purchased).map(i => i.grocery!.name)
    return [...new Set(names)]
  }

  /** Ask "Keep on list / Remove" inside the card; resolves null if the question is dismissed. */
  function askGroceryChoice(names: string[]): Promise<GroceryChoice | null> {
    return new Promise(resolve => setConfirm({ type: 'grocery', names, resolve }))
  }

  /** The choice for saving this draft: undefined if nothing linked comes off, null if he backed out. */
  async function groceryChoiceFor(clean: Draft): Promise<GroceryChoice | null | undefined> {
    const names = stillOnList(ingredientsTakenOff(saved, clean.ingredients).map(t => saved.find(s => s.id === t.id)!))
    if (names.length === 0) return undefined
    return askGroceryChoice(names)
  }

  function close() {
    closingOnPurpose.current = true
    dialogRef.current?.close()
  }

  /** Every way of closing except "Discard changes" goes through here. */
  async function finish() {
    if (confirm?.type === 'grocery') return
    const clean = cleanDraft(draft)
    if (!clean.name && clean.ingredients.length === 0) {
      if (savedId) {
        setConfirm({ type: 'emptyName', names: stillOnList(saved) })
        return
      }
      close()
      return
    }
    if (!clean.name) {
      setNameMessage(true)
      nameRef.current?.focus()
      return
    }
    if (dirty) {
      const groceryChoice = await groceryChoiceFor(clean)
      if (groceryChoice === null) return
      void onSave({ ...toInput(clean), groceryChoice })
    }
    close()
  }

  /** Save without closing (before copying or leaving for the recipe). */
  async function saveNow(): Promise<string | null> {
    const clean = cleanDraft(draft)
    if (!clean.name) {
      setNameMessage(true)
      nameRef.current?.focus()
      return null
    }
    if (!dirty && savedId) return savedId
    const groceryChoice = await groceryChoiceFor(clean)
    if (groceryChoice === null) return null
    const res = await onSave({ ...toInput(clean), groceryChoice })
    if (res.error || !res.meal) {
      setCopyState({ status: 'error', message: `Couldn’t save this meal first, so nothing was copied. (${res.error ?? 'no answer'})` })
      return null
    }
    // Adopt the new ids, so saving again updates these rows instead of adding more.
    const ids = res.meal.ingredients.map(i => i.id)
    const keys = clean.ingredients.map(i => i.key)
    setDraft(d => ({
      ...d,
      ingredients: d.ingredients.map(i => {
        const index = keys.indexOf(i.key)
        return index >= 0 && ids[index] ? { ...i, id: ids[index], relink: false } : i
      }),
    }))
    setBaseline(fingerprint({ ...clean, ingredients: clean.ingredients.map(i => ({ ...i, relink: false })) }))
    setSaved(res.meal.ingredients)
    setSavedId(res.meal.id)
    setSavedName(res.meal.name)
    return res.meal.id
  }

  // ─── Name + recipe suggestions ─────────────────────────────────────────────

  function handleNameChange(value: string) {
    setNameMessage(false)
    setSuggestOpen(true)
    setActiveIndex(-1)
    setDraft(d => {
      const current = findRecipe(d.recipeKey)
      const stillRecipe = current && normalizeGroceryName(value) === normalizeGroceryName(recipeMealName(current))
      return { ...d, name: value, recipeKey: stillRecipe ? d.recipeKey : null }
    })
  }

  function pickRecipe(r: Recipe) {
    setSuggestOpen(false)
    setActiveIndex(-1)
    setNameMessage(false)
    setDraft(d => ({ ...d, name: recipeMealName(r), recipeKey: r.key }))
    const existing = draft.ingredients.filter(i => i.name.trim()).length
    if (existing > 0) setConfirm({ type: 'recipe', recipe: r, count: existing })
    else fillFromRecipe(r)
  }

  function fillFromRecipe(r: Recipe) {
    setConfirm(null)
    setDraft(d => ({
      ...d,
      ingredients: recipeIngredients(r).map(i => ({
        key: newKey(),
        name: i.name,
        quantity: i.quantity ?? '',
        addToGroceries: i.addToGroceries && !isPast,
      })),
    }))
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (suggestions.length === 0) return
      e.preventDefault()
      setSuggestOpen(true)
      const n = suggestions.length
      setActiveIndex(i => (e.key === 'ArrowDown' ? (i + 1) % n : i <= 0 ? n - 1 : i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (showSuggestions && activeIndex >= 0) pickRecipe(suggestions[activeIndex])
    } else if (e.key === 'Escape' && showSuggestions) {
      // Close just the list, not the whole card.
      e.preventDefault()
      e.stopPropagation()
      setSuggestOpen(false)
      setActiveIndex(-1)
    }
  }

  // ─── Ingredients ───────────────────────────────────────────────────────────

  function addIngredientLines(lines: string[]) {
    const added = lines
      .map(line => parseGroceryInput(line))
      .filter(p => p.name)
      .map(p => ({ key: newKey(), name: p.name, quantity: p.quantity ?? '', addToGroceries: !isPast }))
    if (added.length === 0) return
    setDraft(d => ({ ...d, ingredients: [...d.ingredients, ...added] }))
  }

  function handleAddIngredient(e: React.FormEvent) {
    e.preventDefault()
    addIngredientLines([ingredientInput])
    setIngredientInput('')
    ingredientInputRef.current?.focus()
  }

  function handleIngredientPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text')
    if (!/\r?\n/.test(text)) return
    e.preventDefault()
    addIngredientLines(text.split(/\r?\n/))
  }

  function updateIngredient(key: string, patch: Partial<DraftIngredient>) {
    setDraft(d => ({ ...d, ingredients: d.ingredients.map(i => (i.key === key ? { ...i, ...patch } : i)) }))
  }

  /** Enter or Escape finishes an inline edit (Escape without closing the card). */
  function stopEditingOnKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' && e.key !== 'Escape') return
    e.preventDefault()
    e.stopPropagation()
    // Back onto the text it replaced, so keyboard users keep their place.
    const field = e.currentTarget.dataset.edit
    setEditing(null)
    requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>(`[data-edit="${field}"]`)?.focus())
  }

  function removeIngredient(key: string) {
    setDraft(d => ({ ...d, ingredients: d.ingredients.filter(i => i.key !== key) }))
  }

  function setAllTicked(on: boolean) {
    setDraft(d => ({ ...d, ingredients: d.ingredients.map(i => ({ ...i, addToGroceries: on })) }))
  }

  // ─── Copy / delete / recipe link ───────────────────────────────────────────

  async function handleCopy(replace: boolean) {
    if (!isDateString(copyDate)) {
      setCopyState({ status: 'error', message: 'Pick a date to copy to.' })
      return
    }
    if (copyDate === date && copySlot === slot) {
      setCopyState({ status: 'error', message: 'That’s this meal’s own slot. Pick another day or meal.' })
      return
    }
    setCopyState({ status: 'busy' })
    const fromId = await saveNow()
    if (!fromId) {
      setCopyState(s => (s.status === 'busy' ? { status: 'idle' } : s))
      return
    }
    try {
      const res = await onCopy({ fromId, toDate: copyDate, toSlot: copySlot, replace })
      if (res.conflict) setCopyState({ status: 'conflict', name: res.conflict.name })
      else if (res.error) setCopyState({ status: 'error', message: `Couldn’t copy it. (${res.error})` })
      else setCopyState({ status: 'done', message: `Copied to ${copySlot} on ${formatDayLong(copyDate)}.` })
    } catch {
      setCopyState({ status: 'error', message: 'Couldn’t copy it. The connection dropped — try again.' })
    }
  }

  function handleDelete(groceryChoice: GroceryChoice) {
    if (savedId) onDelete({ id: savedId, date, slot, name: savedName }, groceryChoice)
    close()
  }

  function answerGrocery(choice: GroceryChoice) {
    if (confirm?.type === 'grocery') confirm.resolve(choice)
    setConfirm(null)
  }

  /** Esc / back while a question is showing: same as its cancel answer. */
  function dismissConfirm() {
    if (confirm?.type === 'grocery') confirm.resolve(null)
    setConfirm(null)
  }

  async function handleViewRecipe(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    const href = e.currentTarget.getAttribute('href')!
    if (dirty && !(await saveNow())) return
    router.push(href)
  }

  // ─── Dialog events ─────────────────────────────────────────────────────────

  /**
   * Escape is handled here rather than through the dialog's cancel event:
   * Chrome only lets a page hold a dialog open on cancel once per user
   * interaction, so a second Escape would otherwise close it without the
   * checks in finish() (and lose a nameless card's ingredients).
   */
  function handleKeyDown(e: React.KeyboardEvent<HTMLDialogElement>) {
    if (e.key !== 'Escape' || e.defaultPrevented) return
    e.preventDefault()
    if (confirm) dismissConfirm()
    else void finish()
  }

  function handleCancel(e: React.SyntheticEvent<HTMLDialogElement>) {
    // Other close requests (e.g. Android's back button): same as Escape.
    e.preventDefault()
    if (confirm) dismissConfirm()
    else void finish()
  }

  /** If the browser closed it anyway, still keep a valid change rather than drop it. */
  function handleClose() {
    if (!closingOnPurpose.current) {
      const clean = cleanDraft(draft)
      if (clean.name && dirty) void onSave({ ...toInput(clean), groceryChoice: 'keep' })
    }
    onClosed()
  }

  function isOutside(e: React.PointerEvent | React.MouseEvent) {
    const rect = dialogRef.current!.getBoundingClientRect()
    return e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom
  }

  const title = `${MEAL_SLOT_LABELS[slot]} · ${formatDayLong(date)}`
  const activeOptionId = showSuggestions && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
      onCancel={handleCancel}
      onClose={handleClose}
      onPointerDown={e => (pointerDownOutside.current = e.target === dialogRef.current && isOutside(e))}
      onClick={e => {
        if (e.target === dialogRef.current && pointerDownOutside.current && isOutside(e)) void finish()
      }}
    >
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>{title}</h2>
        <button type="button" onClick={() => void finish()} className={styles.closeButton} aria-label="Close">
          ✕
        </button>
      </header>

      <div className={styles.body}>
        {/* ─── Dish name ─── */}
        <div className={styles.field}>
          <label htmlFor={`${titleId}-name`} className={styles.label}>What are you cooking?</label>
          <input
            ref={nameRef}
            id={`${titleId}-name`}
            value={draft.name}
            onChange={e => handleNameChange(e.target.value)}
            onKeyDown={handleNameKeyDown}
            onFocus={() => setSuggestOpen(true)}
            onBlur={() => setSuggestOpen(false)}
            placeholder="e.g. Bolognese"
            autoComplete="off"
            enterKeyHint="next"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls={listboxId}
            aria-activedescendant={activeOptionId}
            aria-invalid={nameMessage || undefined}
            aria-describedby={nameMessage ? `${titleId}-name-msg` : undefined}
            className={`${styles.input} pressed`}
          />
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Recipes from the guide"
            hidden={!showSuggestions}
            className={`${styles.suggestions} raised-sm`}
          >
            {suggestions.map((r, i) => (
              <li
                key={r.key}
                id={`${listboxId}-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                // Keep focus in the field, so a tap doesn't blur and close the list first.
                onPointerDown={e => e.preventDefault()}
                onClick={() => pickRecipe(r)}
                className={`${styles.option} ${i === activeIndex ? styles.optionActive : ''}`}
              >
                <span className={styles.optionEmoji} aria-hidden="true">{r.emoji}</span>
                <span className={styles.optionText}>{recipeMealName(r)}</span>
                <span className={styles.optionHint}>Recipe</span>
              </li>
            ))}
          </ul>
          {nameMessage && (
            <p id={`${titleId}-name-msg`} role="status" className={styles.gentle}>
              Give it a name so it shows on the calendar.
            </p>
          )}
          {recipe && (
            <a href={`/guide/recipes?open=${recipe.key}`} onClick={handleViewRecipe} className={styles.recipeLink}>
              View recipe →
            </a>
          )}
        </div>

        {confirm?.type === 'recipe' && (
          <div className={styles.confirm} role="group" aria-label="Replace ingredients?">
            <p>Replace the {plural(confirm.count, 'ingredient')} already on this card?</p>
            <div className={styles.confirmActions}>
              <button type="button" onClick={() => setConfirm(null)} className={styles.textButton}>
                Keep mine
              </button>
              <button type="button" onClick={() => fillFromRecipe(confirm.recipe)} className={`${styles.smallButton} raised-sm`}>
                Replace
              </button>
            </div>
          </div>
        )}

        {/* ─── Ingredients ─── */}
        <section className={styles.field} aria-labelledby={`${titleId}-ing`}>
          <div className={styles.sectionHead}>
            <h3 id={`${titleId}-ing`} className={styles.label}>
              Ingredients {draft.ingredients.length > 0 && <span className={styles.count}>{draft.ingredients.length}</span>}
            </h3>
            {draft.ingredients.length > 0 && (
              <label className={styles.allToggle}>
                <input
                  ref={allToggleRef}
                  type="checkbox"
                  checked={allTicked}
                  onChange={e => setAllTicked(e.target.checked)}
                  className={styles.checkInput}
                />
                <span className={`${styles.checkbox} ${styles.checkboxSmall} ${tickedCount > 0 ? styles.checkboxOn : ''}`} aria-hidden="true">
                  {allTicked ? '✓' : tickedCount > 0 ? '–' : ''}
                </span>
                Add all to grocery list
              </label>
            )}
          </div>

          <form onSubmit={handleAddIngredient} className={styles.inputBar}>
            <input
              ref={ingredientInputRef}
              value={ingredientInput}
              onChange={e => setIngredientInput(e.target.value)}
              onPaste={handleIngredientPaste}
              placeholder={narrow ? 'e.g. 200g bacon' : 'Add an ingredient, e.g. 200g bacon'}
              aria-label="Add an ingredient"
              enterKeyHint="done"
              autoComplete="off"
              className={`${styles.input} pressed`}
            />
            <button type="submit" disabled={!ingredientInput.trim()} className={`${styles.addButton} raised-sm`}>
              Add
            </button>
          </form>

          {draft.ingredients.length > 0 && (
            <ul className={`${styles.list} raised`}>
              {draft.ingredients.map(i => {
                const label = i.name.trim() || 'this ingredient'
                return (
                  <li key={i.key} className={styles.row}>
                    <label className={styles.tick}>
                      <input
                        type="checkbox"
                        checked={i.addToGroceries}
                        onChange={e => updateIngredient(i.key, { addToGroceries: e.target.checked })}
                        aria-label={`Add ${label} to grocery list`}
                        className={styles.checkInput}
                      />
                      <span className={`${styles.checkbox} ${i.addToGroceries ? styles.checkboxOn : ''}`} aria-hidden="true">
                        {i.addToGroceries ? '✓' : ''}
                      </span>
                    </label>
                    <div className={styles.rowText}>
                      <div className={styles.rowFields}>
                        {editing?.key === i.key && editing.field === 'name' ? (
                          <input
                            autoFocus
                            value={i.name}
                            onChange={e => updateIngredient(i.key, { name: e.target.value })}
                            onBlur={() => setEditing(null)}
                            onKeyDown={stopEditingOnKey}
                            aria-label="Ingredient"
                            data-edit={`${i.key}-name`}
                            autoComplete="off"
                            enterKeyHint="done"
                            className={`${styles.inlineInput} ${styles.inlineNameInput}`}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditing({ key: i.key, field: 'name' })}
                            data-edit={`${i.key}-name`}
                            aria-label={`${label}, edit name`}
                            className={styles.inlineName}
                          >
                            {i.name.trim() || <span className={styles.placeholderText}>name</span>}
                          </button>
                        )}
                        {editing?.key === i.key && editing.field === 'quantity' ? (
                          <input
                            autoFocus
                            value={i.quantity}
                            onChange={e => updateIngredient(i.key, { quantity: e.target.value })}
                            onBlur={() => setEditing(null)}
                            onKeyDown={stopEditingOnKey}
                            aria-label={`Quantity of ${label}`}
                            data-edit={`${i.key}-quantity`}
                            autoComplete="off"
                            enterKeyHint="done"
                            className={`${styles.inlineInput} ${styles.inlineQtyInput}`}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditing({ key: i.key, field: 'quantity' })}
                            data-edit={`${i.key}-quantity`}
                            aria-label={`Quantity of ${label}: ${i.quantity.trim() || 'none'}, edit`}
                            className={styles.inlineQty}
                          >
                            {i.quantity.trim() || <span className={styles.placeholderText}>qty</span>}
                          </button>
                        )}
                      </div>
                      <IngredientStatus
                        ingredient={i}
                        saved={saved.find(s => s.id === i.id)}
                        onAddAgain={() => updateIngredient(i.key, { relink: true })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeIngredient(i.key)}
                      aria-label={`Remove ${label}`}
                      className={styles.removeButton}
                    >
                      ✕
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          {isPast && draft.ingredients.length === 0 && (
            <p className={styles.hint}>This day has passed, so new ingredients won’t go on the grocery list unless you tick them.</p>
          )}
        </section>

        {/* ─── Notes ─── */}
        <div className={styles.field}>
          <label htmlFor={`${titleId}-notes`} className={styles.label}>
            Notes <span className={styles.optional}>(optional)</span>
          </label>
          <textarea
            ref={notesRef}
            id={`${titleId}-notes`}
            value={draft.notes}
            onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
            placeholder="e.g. make double, leftovers for lunch"
            rows={2}
            className={`${styles.textarea} pressed`}
          />
        </div>

        {/* ─── Copy / delete ─── */}
        <div className={styles.moreActions}>
          <button
            type="button"
            onClick={() => {
              setCopyOpen(o => !o)
              setCopyState({ status: 'idle' })
            }}
            aria-expanded={copyOpen}
            className={styles.textButton}
          >
            Copy to another day…
          </button>
          {savedId && confirm?.type !== 'delete' && (
            <button type="button" onClick={() => setConfirm({ type: 'delete', names: stillOnList(saved) })} className={styles.dangerText}>
              Delete meal
            </button>
          )}
        </div>

        {copyOpen && (
          <div className={styles.copyPanel}>
            <div className={styles.copyRow}>
              <label className={styles.copyDateLabel}>
                <span className={styles.label}>Day</span>
                <input
                  type="date"
                  value={copyDate}
                  onChange={e => {
                    setCopyDate(e.target.value)
                    setCopyState({ status: 'idle' })
                  }}
                  className={`${styles.dateInput} pressed`}
                />
              </label>
              <div role="group" aria-label="Meal" className={styles.slotChoice}>
                {MEAL_SLOTS.map(s => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={copySlot === s}
                    onClick={() => {
                      setCopySlot(s)
                      setCopyState({ status: 'idle' })
                    }}
                    className={`${styles.chip} ${copySlot === s ? styles.chipActive + ' pressed-sm' : 'raised-sm'}`}
                  >
                    {MEAL_SLOT_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
            {copyState.status === 'conflict' ? (
              <div className={styles.confirm}>
                <p>
                  Replace “{copyState.name}” on {isDateString(copyDate) ? formatDayLong(copyDate) : copyDate}?
                </p>
                <div className={styles.confirmActions}>
                  <button type="button" onClick={() => setCopyState({ status: 'idle' })} className={styles.textButton}>
                    Cancel
                  </button>
                  <button type="button" onClick={() => handleCopy(true)} className={styles.confirmDanger}>
                    Replace it
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleCopy(false)}
                disabled={copyState.status === 'busy'}
                className={`${styles.smallButton} ${styles.copyButton} raised-sm`}
              >
                {copyState.status === 'busy' ? 'Copying…' : 'Copy'}
              </button>
            )}
            {(copyState.status === 'done' || copyState.status === 'error') && (
              <p role="status" className={copyState.status === 'error' ? styles.errorText : styles.hint}>
                {copyState.message}
              </p>
            )}
          </div>
        )}

        {confirm?.type === 'delete' && (
          <DeleteConfirm
            text={`Delete “${savedName}” from ${formatDayLong(date)}`}
            names={confirm.names}
            cancelLabel="Cancel"
            onCancel={() => setConfirm(null)}
            onDelete={handleDelete}
          />
        )}
      </div>

      <footer className={styles.footer}>
        {confirm?.type === 'grocery' ? (
          <div className={styles.confirm} role="group" aria-label="Keep on grocery list?">
            <p>
              You took {plural(confirm.names.length, 'ingredient')} off this meal that{' '}
              {confirm.names.length === 1 ? 'is' : 'are'} still on your grocery list: {confirm.names.join(', ')}.
              Remove {confirm.names.length === 1 ? 'it' : 'them'} from the list too?
            </p>
            <div className={styles.confirmActions}>
              <button type="button" onClick={() => answerGrocery('keep')} className={styles.textButton}>
                Keep on list
              </button>
              <button type="button" onClick={() => answerGrocery('remove')} className={styles.confirmDanger}>
                Remove
              </button>
            </div>
          </div>
        ) : confirm?.type === 'emptyName' ? (
          <DeleteConfirm
            text={`The name is empty. Delete “${savedName}” from ${formatDayLong(date)}`}
            names={confirm.names}
            cancelLabel="Keep editing"
            onCancel={() => {
              setConfirm(null)
              nameRef.current?.focus()
            }}
            onDelete={handleDelete}
          />
        ) : (
          <div className={styles.footerRow}>
            {dirty ? (
              <button type="button" onClick={close} className={styles.textButton}>
                Discard changes
              </button>
            ) : (
              <span />
            )}
            <button type="button" onClick={() => void finish()} className={`${styles.doneButton} raised-sm`}>
              Done
            </button>
          </div>
        )}
      </footer>
    </dialog>
  )
}

/**
 * The small line under an ingredient: unticked → "not on list"; ticked but
 * its grocery row was removed by hand → "not on list any more" + Add again;
 * its row already bought → "bought".
 */
function IngredientStatus({
  ingredient,
  saved,
  onAddAgain,
}: {
  ingredient: DraftIngredient
  saved: SavedIngredient | undefined
  onAddAgain: () => void
}) {
  if (!ingredient.addToGroceries) return <span className={styles.notOnList}>not on list</span>
  if (!saved || !saved.addToGroceries) return null
  if (!saved.groceryItemId) {
    if (ingredient.relink) return <span className={styles.notOnList}>goes back on the list when you close this</span>
    return (
      <span className={styles.notOnList}>
        not on list any more ·{' '}
        <button type="button" onClick={onAddAgain} className={styles.addAgain} aria-label={`Add ${ingredient.name} to the grocery list again`}>
          Add again
        </button>
      </span>
    )
  }
  if (saved.grocery?.purchased) return <span className={styles.notOnList}>bought</span>
  return null
}

/**
 * Deleting a meal: one question that also covers its grocery rows, if it
 * still feeds any ("Delete meal only" keeps them on the list as they are).
 */
function DeleteConfirm({
  text,
  names,
  cancelLabel,
  onCancel,
  onDelete,
}: {
  text: string
  names: string[]
  cancelLabel: string
  onCancel: () => void
  onDelete: (choice: GroceryChoice) => void
}) {
  return (
    <div className={styles.confirm} role="group" aria-label="Delete meal?">
      {names.length > 0 ? (
        <p>
          {text} and remove its {plural(names.length, 'ingredient')} from your grocery list ({names.join(', ')})?
        </p>
      ) : (
        <p>{text}?</p>
      )}
      <div className={styles.confirmActions}>
        <button type="button" onClick={onCancel} className={styles.textButton}>
          {cancelLabel}
        </button>
        {names.length > 0 ? (
          <>
            <button type="button" onClick={() => onDelete('keep')} className={`${styles.smallButton} raised-sm`}>
              Delete meal only
            </button>
            <button type="button" onClick={() => onDelete('remove')} className={styles.confirmDanger}>
              Delete and remove from list
            </button>
          </>
        ) : (
          <button type="button" onClick={() => onDelete('remove')} className={styles.confirmDanger}>
            Yes, delete it
          </button>
        )}
      </div>
    </div>
  )
}
