/**
 * Server-side: how saving, deleting and copying meals feeds the grocery list.
 * See the comment block above the meal planner section of
 * supabase-schema.sql for the model: a grocery row's quantity is always
 * `base_quantity` + every linked ingredient's quantity (date order, " + ",
 * blanks skipped), and a planner-made row with no links left is deleted
 * unless it has been bought. Bought rows are history and are never touched.
 *
 * Everything goes through a `PlannerStore` scoped to one user (the Supabase
 * one is in lib/mealGroceryStore.ts), so the rules can be checked against an
 * in-memory store too (scripts/check-meal-grocery-sync.ts). Every helper is
 * idempotent: running it twice gives the same result as running it once.
 */
import { categorizeGrocery, normalizeGroceryName } from './groceryCategories'
import { MEAL_SLOTS, type MealSlot } from './mealPlan'
import {
  ingredientsTakenOff,
  joinQuantities,
  type GroceryChoice,
  type MealInput,
} from './mealGroceryRules'

export interface StoredMeal {
  id: string
  planDate: string
  slot: MealSlot
  name: string
  notes: string | null
  recipeKey: string | null
}

export interface StoredIngredient {
  id: string
  mealId: string
  name: string
  quantity: string | null
  addToGroceries: boolean
  groceryItemId: string | null
  sortOrder: number
}

export interface StoredGroceryItem {
  id: string
  name: string
  category: string | null
  quantity: string | null
  baseQuantity: string | null
  origin: 'manual' | 'planner'
  purchased: boolean
}

/** All reads and writes are for one user; implementations filter by user_id. */
export interface PlannerStore {
  upsertMeal(meal: Omit<StoredMeal, 'id'>): Promise<string>
  insertMeal(meal: Omit<StoredMeal, 'id'>): Promise<string>
  getMeal(id: string): Promise<StoredMeal | null>
  findMeal(date: string, slot: MealSlot): Promise<StoredMeal | null>
  /** Its ingredient rows go with it (on delete cascade). */
  deleteMeal(id: string): Promise<void>

  mealIngredients(mealId: string): Promise<StoredIngredient[]>
  ingredientsByIds(ids: string[]): Promise<StoredIngredient[]>
  insertIngredients(rows: Omit<StoredIngredient, 'id' | 'groceryItemId'>[]): Promise<StoredIngredient[]>
  updateIngredient(id: string, patch: Partial<Omit<StoredIngredient, 'id' | 'mealId'>>): Promise<void>
  deleteIngredients(ids: string[]): Promise<void>
  setGroceryLink(ingredientIds: string[], groceryItemId: string | null): Promise<void>
  /** Ingredients linked to a grocery row, with their meal's date and slot. */
  linksTo(groceryItemId: string): Promise<(StoredIngredient & { planDate: string; slot: MealSlot })[]>

  unboughtGroceryItems(): Promise<StoredGroceryItem[]>
  getGroceryItem(id: string): Promise<StoredGroceryItem | null>
  insertGroceryItem(row: Omit<StoredGroceryItem, 'id' | 'purchased'>): Promise<StoredGroceryItem>
  updateGroceryItem(id: string, patch: Partial<Pick<StoredGroceryItem, 'quantity' | 'baseQuantity' | 'origin'>>): Promise<void>
  /** Linked ingredients are unlinked by the database (on delete set null). */
  deleteGroceryItem(id: string): Promise<void>
  /** Normalised name → category the user moved that item to before. */
  categoryOverrides(): Promise<Record<string, string>>
}

// ─── The three grocery helpers ───────────────────────────────────────────────

/**
 * Link ticked, unlinked ingredients to the grocery list: to this user's
 * unbought row with the same normalised name (typed or planner-made, so a
 * planner "milk" joins a typed "milk"), or to a new planner row categorised
 * exactly like a typed item. Bought rows are never joined. Recomputes every
 * row it touched. Returns those rows' ids.
 */
export async function linkIngredients(store: PlannerStore, ingredients: StoredIngredient[]): Promise<string[]> {
  const toLink = ingredients.filter(i => i.addToGroceries && !i.groceryItemId)
  if (toLink.length === 0) return []

  const unbought = await store.unboughtGroceryItems()
  let overrides: Record<string, string> | null = null
  const touched = new Set<string>()

  for (const ingredient of toLink) {
    const key = normalizeGroceryName(ingredient.name)
    let item = unbought.find(u => normalizeGroceryName(u.name) === key)
    if (!item) {
      overrides ??= await store.categoryOverrides()
      item = await store.insertGroceryItem({
        name: ingredient.name.trim(),
        category: categorizeGrocery(ingredient.name, overrides),
        quantity: null,
        baseQuantity: null,
        origin: 'planner',
      })
      unbought.push(item)
    }
    await store.setGroceryLink([ingredient.id], item.id)
    touched.add(item.id)
  }

  for (const id of touched) await recomputeGroceryItem(store, id)
  return [...touched]
}

/** One ingredient: see `linkIngredients`. */
export function linkIngredient(store: PlannerStore, ingredient: StoredIngredient): Promise<string[]> {
  return linkIngredients(store, [ingredient])
}

function byDateThenSlot(a: { planDate: string; slot: MealSlot; sortOrder: number }, b: typeof a) {
  return (
    a.planDate.localeCompare(b.planDate) ||
    MEAL_SLOTS.indexOf(a.slot) - MEAL_SLOTS.indexOf(b.slot) ||
    a.sortOrder - b.sortOrder
  )
}

/**
 * Set a grocery row's quantity to its base quantity plus every linked
 * ingredient's quantity, in date order. A planner-made, unbought row with no
 * links left is deleted. Bought rows are left exactly as they are.
 */
export async function recomputeGroceryItem(store: PlannerStore, groceryItemId: string): Promise<void> {
  const item = await store.getGroceryItem(groceryItemId)
  if (!item || item.purchased) return

  const links = (await store.linksTo(groceryItemId)).sort(byDateThenSlot)
  if (item.origin === 'planner' && links.length === 0) {
    await store.deleteGroceryItem(groceryItemId)
    return
  }
  const quantity = joinQuantities([item.baseQuantity, ...links.map(l => l.quantity)])
  if (quantity !== item.quantity) await store.updateGroceryItem(groceryItemId, { quantity })
}

/** Unlink ingredients from the grocery list ("Remove") and recompute the rows they left. */
export async function unlinkIngredients(store: PlannerStore, ingredientIds: string[]): Promise<void> {
  if (ingredientIds.length === 0) return
  const rows = await store.ingredientsByIds(ingredientIds)
  const itemIds = new Set(rows.map(r => r.groceryItemId).filter((id): id is string => Boolean(id)))
  await store.setGroceryLink(ingredientIds, null)
  for (const id of itemIds) await recomputeGroceryItem(store, id)
}

/**
 * "Keep on list": the grocery rows these ingredients feed stay exactly as they
 * read now, as typed items that no longer follow these ingredients. When no
 * other meal feeds a row, its base quantity becomes its whole current
 * quantity. When other meals still feed it, only these ingredients' share is
 * folded into the base, so those meals keep adding and removing their own.
 * Bought rows are just unlinked.
 */
export async function keepOnList(store: PlannerStore, ingredientIds: string[]): Promise<void> {
  if (ingredientIds.length === 0) return
  const rows = (await store.ingredientsByIds(ingredientIds)).filter(r => r.groceryItemId)
  const byItem = new Map<string, StoredIngredient[]>()
  for (const r of rows) byItem.set(r.groceryItemId!, [...(byItem.get(r.groceryItemId!) ?? []), r])

  for (const [itemId, leaving] of byItem) {
    const item = await store.getGroceryItem(itemId)
    if (!item || item.purchased) continue
    const links = (await store.linksTo(itemId)).sort(byDateThenSlot)
    const leavingIds = new Set(leaving.map(l => l.id))
    const othersStay = links.some(l => !leavingIds.has(l.id))
    const baseQuantity = othersStay
      ? joinQuantities([item.baseQuantity, ...links.filter(l => leavingIds.has(l.id)).map(l => l.quantity)])
      : item.quantity
    await store.updateGroceryItem(itemId, { baseQuantity, origin: 'manual' })
  }
  await unlinkIngredients(store, ingredientIds)
}

/** Take ingredients off the list the way the user chose. Rows already bought are only ever unlinked. */
async function detach(store: PlannerStore, ingredientIds: string[], choice: GroceryChoice) {
  if (choice === 'keep') await keepOnList(store, ingredientIds)
  else await unlinkIngredients(store, ingredientIds)
}

// ─── Meals ───────────────────────────────────────────────────────────────────

/**
 * Save a meal into its day and slot and make its ingredient rows match, then
 * bring the grocery list in line:
 * - links the edit takes off (removed, unticked or renamed ingredients) are
 *   detached per `groceryChoice` (default "keep", so nothing vanishes unasked);
 * - new ticked ingredients, and ones ticked again, are linked;
 * - a ticked ingredient whose grocery row was removed by hand stays off the
 *   list unless `relink` is set ("Add again");
 * - every row whose share changed (e.g. a new quantity) is recomputed.
 */
export async function saveMealWithGroceries(store: PlannerStore, input: MealInput): Promise<string> {
  const mealId = await store.upsertMeal({
    planDate: input.date,
    slot: input.slot,
    name: input.name.trim(),
    notes: input.notes?.trim() || null,
    recipeKey: input.recipeKey,
  })

  const before = await store.mealIngredients(mealId)
  const beforeById = new Map(before.map(b => [b.id, b]))
  const rows = input.ingredients
    .map(i => ({ ...i, name: i.name.trim(), quantity: i.quantity?.trim() || null }))
    .filter(i => i.name)
    .map((i, index) => ({ ...i, id: i.id && beforeById.has(i.id) ? i.id : undefined, sortOrder: index }))

  const touched = new Set(before.map(b => b.groceryItemId).filter((id): id is string => Boolean(id)))
  const takenOff = ingredientsTakenOff(before, rows)
  await detach(store, takenOff.map(t => t.id), input.groceryChoice ?? 'keep')

  const keptIds = new Set(rows.map(r => r.id).filter(Boolean))
  await store.deleteIngredients(before.filter(b => !keptIds.has(b.id)).map(b => b.id))

  const toLink: string[] = []
  for (const row of rows.filter(r => r.id)) {
    const old = beforeById.get(row.id!)!
    await store.updateIngredient(row.id!, {
      name: row.name,
      quantity: row.quantity,
      addToGroceries: row.addToGroceries,
      sortOrder: row.sortOrder,
    })
    // Newly ticked, renamed (its old link was just detached), or "Add again".
    // A ticked one that lost its row by hand otherwise stays off the list.
    const renamed = takenOff.some(t => t.id === row.id) && row.addToGroceries
    if (row.addToGroceries && (!old.addToGroceries || renamed || row.relink)) toLink.push(row.id!)
  }

  const inserted = await store.insertIngredients(
    rows
      .filter(r => !r.id)
      .map(r => ({ mealId, name: r.name, quantity: r.quantity, addToGroceries: r.addToGroceries, sortOrder: r.sortOrder }))
  )

  const linkCandidates = [...(await store.ingredientsByIds(toLink)), ...inserted]
  for (const id of await linkIngredients(store, linkCandidates)) touched.add(id)
  for (const id of touched) await recomputeGroceryItem(store, id)
  return mealId
}

/** Delete a meal; its linked grocery rows are kept or lose this meal's share, per `choice`. */
export async function deleteMealWithGroceries(store: PlannerStore, mealId: string, choice: GroceryChoice = 'keep') {
  const ingredients = await store.mealIngredients(mealId)
  const linked = ingredients.filter(i => i.groceryItemId)
  await detach(store, linked.map(i => i.id), choice)
  await store.deleteMeal(mealId)
  for (const id of new Set(linked.map(i => i.groceryItemId!))) await recomputeGroceryItem(store, id)
}

/**
 * Copy a meal into another day and slot. If that slot is taken, nothing
 * happens unless `replace` (the answer names the meal in the way); a replaced
 * meal's shares come off the grocery list. The copy's ticked ingredients are
 * added without asking; onto a past date they come in unticked.
 */
export async function copyMealWithGroceries(
  store: PlannerStore,
  input: { fromId: string; toDate: string; toSlot: MealSlot; replace: boolean; today: string }
): Promise<{ conflict?: { name: string }; error?: string }> {
  const source = await store.getMeal(input.fromId)
  if (!source) return { error: 'Meal not found' }
  if (source.planDate === input.toDate && source.slot === input.toSlot) return { error: 'That’s this meal’s own slot' }

  const target = await store.findMeal(input.toDate, input.toSlot)
  if (target) {
    if (!input.replace) return { conflict: { name: target.name } }
    await deleteMealWithGroceries(store, target.id, 'remove')
  }

  const copyId = await store.insertMeal({
    planDate: input.toDate,
    slot: input.toSlot,
    name: source.name,
    notes: source.notes,
    recipeKey: source.recipeKey,
  })
  const isPast = input.toDate < input.today
  const inserted = await store.insertIngredients(
    (await store.mealIngredients(source.id)).map((i, index) => ({
      mealId: copyId,
      name: i.name,
      quantity: i.quantity,
      addToGroceries: isPast ? false : i.addToGroceries,
      sortOrder: index,
    }))
  )
  await linkIngredients(store, inserted)
  return {}
}
