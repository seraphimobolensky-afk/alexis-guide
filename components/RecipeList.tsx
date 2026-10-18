'use client'
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { recipes as guideRecipes, type Recipe } from '@/lib/content'
import { userRecipeAsRecipe, type UserRecipe } from '@/lib/userRecipes'
import { useExpandableGroup } from '@/lib/useExpandableGroup'
import { deleteUserRecipe } from '@/app/actions'
import ExpandableCard from './ExpandableCard'
import ExpandAllControl from './ExpandAllControl'
import Bullets from './Bullets'
import PageLinkButton from './PageLinkButton'
import styles from './RecipeList.module.css'

interface Props {
  myRecipes: UserRecipe[]
  /** `?open=<recipe key>` (the meal planner's "View recipe" link): open that recipe and scroll to it. */
  openKey?: string
}

export default function RecipeList({ myRecipes, openKey }: Props) {
  const mine = useMemo(() => myRecipes.map(r => ({ id: r.id, recipe: userRecipeAsRecipe(r) })), [myRecipes])
  const ids = useMemo(() => [...mine.map(m => m.recipe.key), ...guideRecipes.map(r => r.key)], [mine])
  const { isOpen, toggle, allOpen, expandAll, collapseAll } = useExpandableGroup(ids, openKey ? [openKey] : [])

  useEffect(() => {
    if (!openKey) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(`recipe-${openKey}`)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }, [openKey])

  return (
    <>
      <div className={styles.toolbar}>
        <PageLinkButton href="/guide/recipes/new">+ Add your own recipe</PageLinkButton>
        {ids.length > 4 && <ExpandAllControl allOpen={allOpen} onExpandAll={expandAll} onCollapseAll={collapseAll} />}
      </div>

      {mine.length > 0 && (
        <section aria-labelledby="my-recipes-heading" className={styles.group}>
          <h2 id="my-recipes-heading" className={styles.groupLabel}>Your recipes</h2>
          <div className={styles.list}>
            {mine.map(({ id, recipe }) => (
              <RecipeCard key={recipe.key} recipe={recipe} open={isOpen(recipe.key)} onToggle={() => toggle(recipe.key)}>
                <OwnRecipeActions id={id} title={recipe.title} />
              </RecipeCard>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby={mine.length > 0 ? 'guide-recipes-heading' : undefined} className={styles.group}>
        {mine.length > 0 && <h2 id="guide-recipes-heading" className={styles.groupLabel}>From the guide</h2>}
        <div className={styles.list}>
          {guideRecipes.map(r => (
            <RecipeCard key={r.key} recipe={r} open={isOpen(r.key)} onToggle={() => toggle(r.key)} />
          ))}
        </div>
      </section>
    </>
  )
}

function RecipeCard({ recipe: r, open, onToggle, children }: { recipe: Recipe; open: boolean; onToggle: () => void; children?: ReactNode }) {
  return (
    <ExpandableCard
      id={`recipe-${r.key}`}
      icon={<span className={styles.emoji}>{r.emoji}</span>}
      title={r.title}
      open={open}
      onToggle={onToggle}
    >
      {r.intro && <p className={styles.intro}>{r.intro}</p>}
      <div className={styles.body}>
        {r.ingredients.length > 0 && (
          <div className={styles.col}>
            <p className={styles.colLabel}>Ingredients</p>
            <Bullets items={r.ingredients} />
          </div>
        )}
        {r.steps.length > 0 && (
          <div className={styles.col}>
            <p className={styles.colLabel}>Steps</p>
            <ol className={styles.steps}>
              {r.steps.map((step, i) => (
                <li key={i} className={styles.step}>
                  <div className={`${styles.stepNum} pressed-icon`}>{i + 1}</div>
                  <div className={styles.stepBody}>
                    <p className={styles.stepText}>{step.text}</p>
                    {step.children && step.children.length > 0 && (
                      <Bullets items={step.children} level={1} />
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
      {children}
    </ExpandableCard>
  )
}

/** Edit, or delete after a confirm. */
function OwnRecipeActions({ id, title }: { id: string; title: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const keepRef = useRef<HTMLButtonElement>(null)
  const deleteRef = useRef<HTMLButtonElement>(null)
  // The buttons swap places, so move focus along with them (not on first render).
  const swapped = useRef(false)
  useEffect(() => {
    if (!swapped.current) return
    ;(confirming ? keepRef : deleteRef).current?.focus()
  }, [confirming])

  function setConfirmingAndFocus(value: boolean) {
    swapped.current = true
    setConfirming(value)
  }

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const res = await deleteUserRecipe(id)
      if (res.error) setError('Couldn’t delete it just now. Try again in a moment.')
      else router.refresh()
    })
  }

  return (
    <div className={styles.own}>
      {confirming ? (
        <div className={styles.confirm} role="group" aria-label={`Delete ${title}?`}>
          <p className={styles.confirmText}>Delete this recipe? Meals you planned with it stay on the calendar.</p>
          <div className={styles.actions}>
            <button ref={keepRef} type="button" onClick={() => setConfirmingAndFocus(false)} disabled={pending} className={`${styles.button} raised-sm`}>
              Keep it
            </button>
            <button type="button" onClick={handleDelete} disabled={pending} className={`${styles.button} ${styles.danger} raised-sm`}>
              {pending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          <Link href={`/guide/recipes/${id}/edit`} className={`${styles.button} raised-sm`}>
            Edit
          </Link>
          <button ref={deleteRef} type="button" onClick={() => setConfirmingAndFocus(true)} className={`${styles.button} ${styles.danger} raised-sm`}>
            Delete
          </button>
        </div>
      )}
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </div>
  )
}
