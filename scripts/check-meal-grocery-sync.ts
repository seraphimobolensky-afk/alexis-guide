/**
 * Scripted check of the meal planner → grocery list rules (Phase 14), run
 * against an in-memory store that behaves like the database (cascade and
 * set-null foreign keys included). No test framework:
 *
 *   npm run check:meal-sync
 */
import {
  copyMealWithGroceries,
  deleteMealWithGroceries,
  linkIngredients,
  recomputeGroceryItem,
  saveMealWithGroceries,
  type PlannerStore,
  type StoredGroceryItem,
  type StoredIngredient,
  type StoredMeal,
} from '../lib/mealGrocerySync'
import { ingredientsTakenOff, type GroceryChoice, type MealIngredientInput } from '../lib/mealGroceryRules'
import { parseGroceryInput } from '../lib/groceryCategories'
import type { MealSlot } from '../lib/mealPlan'

const TODAY = '2026-10-18'

// ─── In-memory store ─────────────────────────────────────────────────────────

class FakeStore implements PlannerStore {
  meals: StoredMeal[] = []
  ingredients: StoredIngredient[] = []
  grocery: StoredGroceryItem[] = []
  private seq = 0
  private id(prefix: string) {
    return `${prefix}${++this.seq}`
  }

  async upsertMeal(meal: Omit<StoredMeal, 'id'>) {
    const existing = this.meals.find(m => m.planDate === meal.planDate && m.slot === meal.slot)
    if (existing) {
      Object.assign(existing, meal)
      return existing.id
    }
    return this.insertMeal(meal)
  }
  async insertMeal(meal: Omit<StoredMeal, 'id'>) {
    const row = { ...meal, id: this.id('meal') }
    this.meals.push(row)
    return row.id
  }
  async getMeal(id: string) {
    return this.meals.find(m => m.id === id) ?? null
  }
  async findMeal(date: string, slot: MealSlot) {
    return this.meals.find(m => m.planDate === date && m.slot === slot) ?? null
  }
  async deleteMeal(id: string) {
    this.meals = this.meals.filter(m => m.id !== id)
    this.ingredients = this.ingredients.filter(i => i.mealId !== id) // on delete cascade
  }
  async mealIngredients(mealId: string) {
    return this.ingredients.filter(i => i.mealId === mealId).sort((a, b) => a.sortOrder - b.sortOrder).map(i => ({ ...i }))
  }
  async ingredientsByIds(ids: string[]) {
    return this.ingredients.filter(i => ids.includes(i.id)).map(i => ({ ...i }))
  }
  async insertIngredients(rows: Omit<StoredIngredient, 'id' | 'groceryItemId'>[]) {
    const added = rows.map(r => ({ ...r, id: this.id('ing'), groceryItemId: null }))
    this.ingredients.push(...added)
    return added.map(a => ({ ...a }))
  }
  async updateIngredient(id: string, patch: Partial<Omit<StoredIngredient, 'id' | 'mealId'>>) {
    Object.assign(this.ingredients.find(i => i.id === id)!, patch)
  }
  async deleteIngredients(ids: string[]) {
    this.ingredients = this.ingredients.filter(i => !ids.includes(i.id))
  }
  async setGroceryLink(ids: string[], groceryItemId: string | null) {
    for (const i of this.ingredients) if (ids.includes(i.id)) i.groceryItemId = groceryItemId
  }
  async linksTo(groceryItemId: string) {
    return this.ingredients
      .filter(i => i.groceryItemId === groceryItemId)
      .map(i => {
        const meal = this.meals.find(m => m.id === i.mealId)!
        return { ...i, planDate: meal.planDate, slot: meal.slot }
      })
  }
  async unboughtGroceryItems() {
    return this.grocery.filter(g => !g.purchased).map(g => ({ ...g }))
  }
  async getGroceryItem(id: string) {
    const g = this.grocery.find(x => x.id === id)
    return g ? { ...g } : null
  }
  async insertGroceryItem(row: Omit<StoredGroceryItem, 'id' | 'purchased'>) {
    const g = { ...row, id: this.id('gro'), purchased: false }
    this.grocery.push(g)
    return { ...g }
  }
  async updateGroceryItem(id: string, patch: Partial<Pick<StoredGroceryItem, 'quantity' | 'baseQuantity' | 'origin'>>) {
    Object.assign(this.grocery.find(g => g.id === id)!, patch)
  }
  async deleteGroceryItem(id: string) {
    this.grocery = this.grocery.filter(g => g.id !== id)
    for (const i of this.ingredients) if (i.groceryItemId === id) i.groceryItemId = null // on delete set null
  }
  async categoryOverrides() {
    return { eggs: 'Other' }
  }

  // Test helpers (not part of PlannerStore)
  /** Like addGroceryItem: a typed row, base quantity = what was typed. */
  typed(text: string, purchased = false) {
    const { name, quantity } = parseGroceryInput(text)
    const g: StoredGroceryItem = { id: this.id('gro'), name, category: 'Other', quantity, baseQuantity: quantity, origin: 'manual', purchased }
    this.grocery.push(g)
    return g
  }
  row(name: string) {
    return this.grocery.filter(g => g.name.toLowerCase() === name.toLowerCase())
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0
function check(label: string, ok: boolean, detail = '') {
  if (ok) passed++
  else failed++
  console.log(`  ${ok ? '✓' : '✗'} ${label}${detail ? `  — ${detail}` : ''}`)
}
const show = (g: StoredGroceryItem[]) =>
  g.length === 0 ? '(no row)' : g.map(x => `${x.name} "${x.quantity ?? ''}" [${x.origin}${x.purchased ? ', bought' : ''}]`).join(', ')

const ing = (text: string, addToGroceries = true): MealIngredientInput => {
  const { name, quantity } = parseGroceryInput(text)
  return { name, quantity, addToGroceries, sortOrder: 0 }
}

function save(store: FakeStore, date: string, slot: MealSlot, name: string, ingredients: MealIngredientInput[], groceryChoice?: GroceryChoice) {
  return saveMealWithGroceries(store, { date, slot, name, notes: null, recipeKey: null, ingredients, groceryChoice })
}

/** The meal's ingredients as the card would send them back (ids kept). */
async function current(store: FakeStore, mealId: string): Promise<MealIngredientInput[]> {
  return (await store.mealIngredients(mealId)).map(i => ({ id: i.id, name: i.name, quantity: i.quantity, addToGroceries: i.addToGroceries, sortOrder: i.sortOrder }))
}

// ─── Scenarios ───────────────────────────────────────────────────────────────

async function main() {
  {
    console.log('\n1. A new meal adds its ticked ingredients')
    const s = new FakeStore()
    await save(s, '2026-10-19', 'dinner', 'Bacon pasta', [ing('200g bacon'), ing('cream'), ing('white wine', false)])
    check('bacon is on the list as a planner row', s.row('bacon').length === 1 && s.row('bacon')[0].quantity === '200g' && s.row('bacon')[0].origin === 'planner', show(s.row('bacon')))
    check('cream is on the list with no quantity', s.row('cream').length === 1 && s.row('cream')[0].quantity === null, show(s.row('cream')))
    check('unticked white wine is not', s.row('white wine').length === 0)
    check('categorised like a typed item', s.row('bacon')[0].category === 'Meat & fish', `category: ${s.row('bacon')[0].category}`)
  }

  {
    console.log('\n2–4. Two meals with eggs share one row; deleting them takes their shares off')
    const s = new FakeStore()
    const mon = await save(s, '2026-10-19', 'breakfast', 'Scrambled eggs', [ing('2 eggs')])
    const tue = await save(s, '2026-10-20', 'breakfast', 'Boiled eggs', [ing('3 eggs')])
    check('one row, "2 + 3"', s.row('eggs').length === 1 && s.row('eggs')[0].quantity === '2 + 3', show(s.row('eggs')))
    await deleteMealWithGroceries(s, mon, 'remove')
    check('deleting Monday leaves "3"', s.row('eggs')[0]?.quantity === '3', show(s.row('eggs')))
    await deleteMealWithGroceries(s, tue, 'remove')
    check('deleting both removes the row', s.row('eggs').length === 0, show(s.row('eggs')))
  }

  {
    console.log('\n5. A bought "Eggs" row is never merged into and never removed')
    const s = new FakeStore()
    const bought = s.typed('Eggs 6', true)
    const meal = await save(s, '2026-10-19', 'breakfast', 'Omelette', [ing('3 eggs')])
    const rows = s.row('eggs')
    check('a new unbought row is made instead', rows.length === 2 && rows.some(r => !r.purchased && r.quantity === '3'), show(rows))
    check('the bought row is unchanged', JSON.stringify(s.grocery.find(g => g.id === bought.id)) === JSON.stringify({ ...bought }), show([bought]))
    // Tick the planner row off as bought too, then delete the meal.
    s.grocery.find(r => !r.purchased && r.name === 'eggs')!.purchased = true
    await deleteMealWithGroceries(s, meal, 'remove')
    check('deleting the meal leaves both bought rows as they were', s.row('eggs').length === 2 && s.row('eggs').every(r => r.purchased), show(s.row('eggs')))
  }

  {
    console.log('\n6. Unticking asks, and "Keep on list" leaves the row exactly as it was')
    const s = new FakeStore()
    const meal = await save(s, '2026-10-19', 'dinner', 'Bacon pasta', [ing('200g bacon'), ing('cream')])
    const savedRows = await s.mealIngredients(meal)
    const edited = (await current(s, meal)).map(i => (i.name === 'bacon' ? { ...i, addToGroceries: false } : i))
    const asked = ingredientsTakenOff(savedRows, edited)
    check('unticking bacon is a change the card asks about', asked.length === 1 && asked[0].name === 'bacon', `taken off: ${asked.map(a => a.name).join(', ') || 'none'}`)
    check('an edit that only changes a quantity does not ask', ingredientsTakenOff(savedRows, (await current(s, meal)).map(i => ({ ...i, quantity: '300g' }))).length === 0)
    check('removing an ingredient asks', ingredientsTakenOff(savedRows, (await current(s, meal)).filter(i => i.name !== 'cream')).length === 1)

    const before = { ...s.row('bacon')[0] }
    await save(s, '2026-10-19', 'dinner', 'Bacon pasta', edited, 'keep')
    const after = s.row('bacon')[0]
    check('row still reads the same', after && after.name === before.name && after.quantity === before.quantity && after.category === before.category && !after.purchased, `${show([before])} → ${show(s.row('bacon'))}`)
    check('…and is now a standalone typed item', after?.origin === 'manual' && after.baseQuantity === '200g' && s.ingredients.every(i => i.groceryItemId !== after.id))
    await deleteMealWithGroceries(s, meal, 'remove')
    check('deleting the meal later doesn’t touch it', s.row('bacon')[0]?.quantity === '200g', show(s.row('bacon')))
    check('cream (still linked) was removed with the meal', s.row('cream').length === 0, show(s.row('cream')))
  }

  {
    console.log('\n6b. Unticking with "Remove" takes it off')
    const s = new FakeStore()
    const meal = await save(s, '2026-10-19', 'dinner', 'Bacon pasta', [ing('200g bacon')])
    await save(s, '2026-10-19', 'dinner', 'Bacon pasta', (await current(s, meal)).map(i => ({ ...i, addToGroceries: false })), 'remove')
    check('planner-only row is gone', s.row('bacon').length === 0, show(s.row('bacon')))
  }

  {
    console.log('\n7. A typed "milk 1l" and a planner "milk 500ml" share a row')
    const s = new FakeStore()
    s.typed('milk 1l')
    const meal = await save(s, '2026-10-19', 'breakfast', 'Overnight oats', [ing('milk 500ml')])
    check('"1l + 500ml"', s.row('milk').length === 1 && s.row('milk')[0].quantity === '1l + 500ml', show(s.row('milk')))
    await deleteMealWithGroceries(s, meal, 'remove')
    check('removing the meal leaves "1l", still his typed row', s.row('milk').length === 1 && s.row('milk')[0].quantity === '1l' && s.row('milk')[0].origin === 'manual', show(s.row('milk')))
  }

  {
    console.log('\n8. Quantities, hand-removed rows, copies and repeat runs')
    const s = new FakeStore()
    const meal = await save(s, '2026-10-19', 'dinner', 'Omelette', [ing('2 eggs')])
    await save(s, '2026-10-19', 'dinner', 'Omelette', (await current(s, meal)).map(i => ({ ...i, quantity: '4' })))
    check('changing a linked quantity recomputes the row', s.row('eggs')[0]?.quantity === '4', show(s.row('eggs')))

    await s.deleteGroceryItem(s.row('eggs')[0].id) // removed from the grocery list by hand
    await save(s, '2026-10-19', 'dinner', 'Omelette', await current(s, meal))
    check('saving again does not quietly put it back', s.row('eggs').length === 0, show(s.row('eggs')))
    await save(s, '2026-10-19', 'dinner', 'Omelette', (await current(s, meal)).map(i => ({ ...i, relink: true })))
    check('"Add again" puts it back', s.row('eggs')[0]?.quantity === '4', show(s.row('eggs')))

    const snapshot = JSON.stringify(s.grocery)
    await linkIngredients(s, await s.mealIngredients(meal))
    for (const g of s.grocery) await recomputeGroceryItem(s, g.id)
    await save(s, '2026-10-19', 'dinner', 'Omelette', await current(s, meal))
    check('running the helpers again changes nothing', JSON.stringify(s.grocery) === snapshot)

    await copyMealWithGroceries(s, { fromId: meal, toDate: '2026-10-21', toSlot: 'dinner', replace: false, today: TODAY })
    check('a copy just adds its share', s.row('eggs')[0]?.quantity === '4 + 4', show(s.row('eggs')))
    await copyMealWithGroceries(s, { fromId: meal, toDate: '2026-10-10', toSlot: 'dinner', replace: false, today: TODAY })
    check('a copy onto a past date adds nothing', s.row('eggs')[0]?.quantity === '4 + 4', show(s.row('eggs')))
    const conflict = await copyMealWithGroceries(s, { fromId: meal, toDate: '2026-10-21', toSlot: 'dinner', replace: false, today: TODAY })
    check('copying onto a taken slot asks first', conflict.conflict?.name === 'Omelette')
    await copyMealWithGroceries(s, { fromId: meal, toDate: '2026-10-21', toSlot: 'dinner', replace: true, today: TODAY })
    check('replacing swaps the old share for the new one', s.row('eggs')[0]?.quantity === '4 + 4', show(s.row('eggs')))
  }

  {
    console.log('\n9. "Keep on list" on a row other meals still feed')
    const s = new FakeStore()
    await save(s, '2026-10-19', 'breakfast', 'Scrambled eggs', [ing('2 eggs')])
    const tue = await save(s, '2026-10-20', 'breakfast', 'Boiled eggs', [ing('3 eggs')])
    await save(s, '2026-10-20', 'breakfast', 'Boiled eggs', (await current(s, tue)).map(i => ({ ...i, addToGroceries: false })), 'keep')
    const row = s.row('eggs')[0]
    check('Tuesday’s 3 stays as typed, Monday keeps following', row?.baseQuantity === '3' && row.origin === 'manual' && row.quantity === '3 + 2', show(s.row('eggs')))
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
