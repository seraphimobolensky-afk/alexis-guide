'use client'
import { useId, useLayoutEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { parseGroceryInput } from '@/lib/groceryCategories'
import {
  DEFAULT_RECIPE_EMOJI,
  RECIPE_LIMITS,
  splitIngredientLines,
  splitStepLines,
  userRecipeKey,
  type UserRecipe,
} from '@/lib/userRecipes'
import { saveUserRecipe } from '@/app/actions'
import styles from './RecipeForm.module.css'

interface Props {
  /** The recipe being edited; a new one when left out. */
  recipe?: UserRecipe
}

interface DraftIngredient {
  key: string
  name: string
  quantity: string
}

let keySeq = 0
const newKey = () => `ri-${++keySeq}`

/**
 * Add or edit one of Alexis's own recipes. Ingredients can be pasted as a
 * whole list (each line becomes its own item, quantity split off) or added
 * one at a time; every item stays editable. Steps are one per line.
 */
export default function RecipeForm({ recipe }: Props) {
  const router = useRouter()
  const formId = useId()
  const [title, setTitle] = useState(recipe?.title ?? '')
  const [emoji, setEmoji] = useState(recipe?.emoji ?? '')
  const [intro, setIntro] = useState(recipe?.intro ?? '')
  const [ingredients, setIngredients] = useState<DraftIngredient[]>(
    () => recipe?.ingredients.map(i => ({ key: newKey(), name: i.name, quantity: i.quantity ?? '' })) ?? []
  )
  const [ingredientInput, setIngredientInput] = useState('')
  const [steps, setSteps] = useState(recipe?.steps.join('\n') ?? '')
  const [titleMessage, setTitleMessage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Read out after a paste, so a screen reader hears how many items it made. */
  const [announcement, setAnnouncement] = useState('')
  const [pending, startTransition] = useTransition()
  const titleRef = useRef<HTMLInputElement>(null)
  const ingredientInputRef = useRef<HTMLTextAreaElement>(null)
  const introRef = useRef<HTMLTextAreaElement>(null)
  const stepsRef = useRef<HTMLTextAreaElement>(null)

  // Text boxes grow with their content.
  useLayoutEffect(() => {
    for (const el of [introRef.current, stepsRef.current, ingredientInputRef.current]) {
      if (!el) continue
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
  }, [intro, steps, ingredientInput])

  const cancelHref = recipe ? `/guide/recipes?open=${userRecipeKey(recipe.id)}` : '/guide/recipes'

  function addIngredientLines(lines: string[]) {
    const room = RECIPE_LIMITS.ingredients - ingredients.length
    const added = lines
      .map(line => parseGroceryInput(line))
      .filter(p => p.name)
      .slice(0, Math.max(room, 0))
      .map(p => ({ key: newKey(), name: p.name, quantity: p.quantity ?? '' }))
    if (added.length === 0) return 0
    setIngredients(list => [...list, ...added])
    return added.length
  }

  function handleAddIngredient() {
    if (addIngredientLines([ingredientInput]) > 0) setIngredientInput('')
    ingredientInputRef.current?.focus()
  }

  /**
   * The add field is a one-row text box rather than an input, so a pasted list
   * keeps its line breaks however it arrives (a phone keyboard's clipboard
   * button doesn't fire a paste event). A line break means "add": every line
   * becomes its own item.
   */
  function handleIngredientChange(value: string) {
    if (!/[\r\n]/.test(value)) {
      setIngredientInput(value)
      return
    }
    const count = addIngredientLines(splitIngredientLines(value))
    setIngredientInput('')
    if (count > 1) setAnnouncement(`Added ${count} ingredients`)
  }

  function updateIngredient(key: string, patch: Partial<DraftIngredient>) {
    setIngredients(list => list.map(i => (i.key === key ? { ...i, ...patch } : i)))
  }

  function removeIngredient(key: string, index: number) {
    setIngredients(list => list.filter(i => i.key !== key))
    // Keep focus nearby: the next row's remove button, or the add field.
    requestAnimationFrame(() => {
      const buttons = document.querySelectorAll<HTMLButtonElement>(`[data-remove="${formId}"]`)
      ;(buttons[Math.min(index, buttons.length - 1)] ?? ingredientInputRef.current)?.focus()
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setTitleMessage(true)
      titleRef.current?.focus()
      return
    }
    setError(null)
    // Something typed in the add field but not added yet still counts.
    const pendingLine = ingredientInput.trim() ? parseGroceryInput(ingredientInput) : null
    const all = [...ingredients, ...(pendingLine?.name ? [{ key: '', ...pendingLine, quantity: pendingLine.quantity ?? '' }] : [])]
    startTransition(async () => {
      const res = await saveUserRecipe({
        id: recipe?.id,
        title,
        emoji,
        intro,
        ingredients: all.map(i => ({ name: i.name, quantity: i.quantity || null })),
        steps: splitStepLines(steps),
      })
      if (res.error || !res.id) {
        setError('Couldn’t save the recipe just now. Check your connection and try again.')
        return
      }
      router.push(`/guide/recipes?open=${userRecipeKey(res.id)}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className={`${styles.form} raised`} noValidate>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor={`${formId}-emoji`} className={styles.label}>Icon</label>
          <input
            id={`${formId}-emoji`}
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
            placeholder={DEFAULT_RECIPE_EMOJI}
            maxLength={RECIPE_LIMITS.emoji}
            autoComplete="off"
            className={`${styles.input} ${styles.iconInput} pressed`}
          />
        </div>
        <div className={`${styles.field} ${styles.grow}`}>
          <label htmlFor={`${formId}-title`} className={styles.label}>Name</label>
          <input
            ref={titleRef}
            id={`${formId}-title`}
            value={title}
            onChange={e => {
              setTitle(e.target.value)
              setTitleMessage(false)
            }}
            placeholder="e.g. Mum’s lasagne"
            maxLength={RECIPE_LIMITS.title}
            autoComplete="off"
            aria-invalid={titleMessage || undefined}
            aria-describedby={titleMessage ? `${formId}-title-msg` : undefined}
            className={`${styles.input} pressed`}
          />
        </div>
      </div>
      {titleMessage && (
        <p id={`${formId}-title-msg`} className={styles.gentle}>Give it a name so you can find it later.</p>
      )}

      <div className={styles.field}>
        <label htmlFor={`${formId}-intro`} className={styles.label}>
          About it <span className={styles.optional}>(optional)</span>
        </label>
        <textarea
          ref={introRef}
          id={`${formId}-intro`}
          value={intro}
          onChange={e => setIntro(e.target.value)}
          placeholder="Where it’s from, why it’s good…"
          maxLength={RECIPE_LIMITS.intro}
          rows={2}
          className={`${styles.textarea} pressed`}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor={`${formId}-ingredient`} className={styles.label}>
          Ingredients{ingredients.length > 0 && <span className={styles.count}>{ingredients.length}</span>}
        </label>
        <p id={`${formId}-ingredient-hint`} className={styles.hint}>
          Paste a whole list and each line becomes its own item, or add them one at a time.
        </p>
        <div className={styles.inputBar}>
          <textarea
            ref={ingredientInputRef}
            id={`${formId}-ingredient`}
            value={ingredientInput}
            onChange={e => handleIngredientChange(e.target.value)}
            onKeyDown={e => {
              // Enter adds the ingredient rather than saving the whole recipe.
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddIngredient()
              }
            }}
            placeholder="e.g. 500g beef mince"
            aria-describedby={`${formId}-ingredient-hint`}
            enterKeyHint="done"
            autoComplete="off"
            rows={1}
            className={`${styles.input} ${styles.addInput} pressed`}
          />
          <button type="button" onClick={handleAddIngredient} disabled={!ingredientInput.trim()} className={`${styles.addButton} raised-sm`}>
            Add
          </button>
        </div>
        <p role="status" className={styles.srOnly}>{announcement}</p>

        {ingredients.length > 0 && (
          <ul className={`${styles.list} raised`} aria-label="Ingredients">
            {ingredients.map((i, index) => {
              const label = i.name.trim() || 'this ingredient'
              return (
                <li key={i.key} className={styles.ingredient}>
                  <LineField
                    value={i.name}
                    onChange={name => updateIngredient(i.key, { name })}
                    label={`Ingredient ${index + 1}`}
                    placeholder="name"
                    className={styles.rowName}
                  />
                  <LineField
                    value={i.quantity}
                    onChange={quantity => updateIngredient(i.key, { quantity })}
                    label={`Quantity of ${label}`}
                    placeholder="qty"
                    className={styles.rowQty}
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(i.key, index)}
                    data-remove={formId}
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
      </div>

      <div className={styles.field}>
        <label htmlFor={`${formId}-steps`} className={styles.label}>
          Steps <span className={styles.optional}>(optional)</span>
        </label>
        <p id={`${formId}-steps-hint`} className={styles.hint}>One step per line. Numbered steps can be pasted as they are.</p>
        <textarea
          ref={stepsRef}
          id={`${formId}-steps`}
          value={steps}
          onChange={e => setSteps(e.target.value)}
          placeholder={'Brown the mince\nAdd the sauce and simmer for 20 minutes'}
          aria-describedby={`${formId}-steps-hint`}
          rows={4}
          className={`${styles.textarea} pressed`}
        />
      </div>

      {error && <p role="alert" className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <Link href={cancelHref} className={styles.cancel}>Cancel</Link>
        <button type="submit" disabled={pending} className={`${styles.submit} raised-sm`}>
          {pending ? 'Saving…' : recipe ? 'Save changes' : 'Save recipe'}
        </button>
      </div>
    </form>
  )
}

/**
 * An ingredient's name or quantity as a text box that wraps and grows, so a
 * long one stays readable on a phone. It's still one line of text: Enter does
 * nothing and pasted line breaks become spaces.
 */
function LineField({ value, onChange, label, placeholder, className }: {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder: string
  className: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value.replace(/\s*[\r\n]+\s*/g, ' '))}
      onKeyDown={e => {
        if (e.key === 'Enter') e.preventDefault()
      }}
      aria-label={label}
      placeholder={placeholder}
      maxLength={RECIPE_LIMITS.ingredient}
      autoComplete="off"
      enterKeyHint="done"
      rows={1}
      className={`${styles.rowInput} ${className}`}
    />
  )
}
