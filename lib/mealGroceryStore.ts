import type { SupabaseClient } from '@supabase/supabase-js'
import { isMealSlot, type MealSlot } from './mealPlan'
import type { PlannerStore, StoredGroceryItem, StoredIngredient, StoredMeal } from './mealGrocerySync'

/**
 * The Supabase-backed `PlannerStore` for one user. Every query filters by
 * `user_id` as well as relying on RLS. Errors throw; the server actions turn
 * them into `{ error }`.
 */
export function supabasePlannerStore(supabase: SupabaseClient, userId: string): PlannerStore {
  const fail = (what: string, error: { message: string } | null) => {
    if (error) throw new Error(`${what}: ${error.message}`)
  }

  type MealRow = { id: string; plan_date: string; slot: string; name: string; notes: string | null; recipe_key: string | null }
  const toMeal = (m: MealRow): StoredMeal => ({
    id: m.id,
    planDate: m.plan_date,
    slot: (isMealSlot(m.slot) ? m.slot : 'dinner') as MealSlot,
    name: m.name,
    notes: m.notes,
    recipeKey: m.recipe_key,
  })
  const mealRow = (m: Omit<StoredMeal, 'id'>) => ({
    user_id: userId,
    plan_date: m.planDate,
    slot: m.slot,
    name: m.name,
    notes: m.notes,
    recipe_key: m.recipeKey,
    updated_at: new Date().toISOString(),
  })

  const INGREDIENT = 'id, meal_id, name, quantity, add_to_groceries, grocery_item_id, sort_order'
  type IngredientRow = {
    id: string; meal_id: string; name: string; quantity: string | null
    add_to_groceries: boolean; grocery_item_id: string | null; sort_order: number
  }
  const toIngredient = (i: IngredientRow): StoredIngredient => ({
    id: i.id,
    mealId: i.meal_id,
    name: i.name,
    quantity: i.quantity,
    addToGroceries: i.add_to_groceries,
    groceryItemId: i.grocery_item_id,
    sortOrder: i.sort_order,
  })

  const GROCERY = 'id, name, category, quantity, base_quantity, origin, purchased'
  type GroceryRow = {
    id: string; name: string; category: string | null; quantity: string | null
    base_quantity: string | null; origin: string; purchased: boolean
  }
  const toGrocery = (g: GroceryRow): StoredGroceryItem => ({
    id: g.id,
    name: g.name,
    category: g.category,
    quantity: g.quantity,
    baseQuantity: g.base_quantity,
    origin: g.origin === 'planner' ? 'planner' : 'manual',
    purchased: g.purchased,
  })

  return {
    async upsertMeal(meal) {
      const { data, error } = await supabase
        .from('meal_plans')
        .upsert(mealRow(meal), { onConflict: 'user_id,plan_date,slot' })
        .select('id')
        .single()
      fail('Saving the meal', error)
      return data!.id
    },

    async insertMeal(meal) {
      const { data, error } = await supabase.from('meal_plans').insert(mealRow(meal)).select('id').single()
      fail('Adding the meal', error)
      return data!.id
    },

    async getMeal(id) {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('id, plan_date, slot, name, notes, recipe_key')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle()
      fail('Loading the meal', error)
      return data ? toMeal(data) : null
    },

    async findMeal(date, slot) {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('id, plan_date, slot, name, notes, recipe_key')
        .eq('user_id', userId)
        .eq('plan_date', date)
        .eq('slot', slot)
        .maybeSingle()
      fail('Checking that slot', error)
      return data ? toMeal(data) : null
    },

    async deleteMeal(id) {
      const { error } = await supabase.from('meal_plans').delete().eq('id', id).eq('user_id', userId)
      fail('Deleting the meal', error)
    },

    async mealIngredients(mealId) {
      const { data, error } = await supabase
        .from('meal_ingredients')
        .select(INGREDIENT)
        .eq('meal_id', mealId)
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })
      fail('Loading ingredients', error)
      return (data ?? []).map(toIngredient)
    },

    async ingredientsByIds(ids) {
      if (ids.length === 0) return []
      const { data, error } = await supabase.from('meal_ingredients').select(INGREDIENT).in('id', ids).eq('user_id', userId)
      fail('Loading ingredients', error)
      return (data ?? []).map(toIngredient)
    },

    async insertIngredients(rows) {
      if (rows.length === 0) return []
      const { data, error } = await supabase
        .from('meal_ingredients')
        .insert(
          rows.map(r => ({
            meal_id: r.mealId,
            user_id: userId,
            name: r.name,
            quantity: r.quantity,
            add_to_groceries: r.addToGroceries,
            sort_order: r.sortOrder,
          }))
        )
        .select(INGREDIENT)
      fail('Adding ingredients', error)
      return (data ?? []).map(toIngredient)
    },

    async updateIngredient(id, patch) {
      const row: Record<string, unknown> = {}
      if (patch.name !== undefined) row.name = patch.name
      if (patch.quantity !== undefined) row.quantity = patch.quantity
      if (patch.addToGroceries !== undefined) row.add_to_groceries = patch.addToGroceries
      if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder
      if (patch.groceryItemId !== undefined) row.grocery_item_id = patch.groceryItemId
      const { error } = await supabase.from('meal_ingredients').update(row).eq('id', id).eq('user_id', userId)
      fail('Saving an ingredient', error)
    },

    async deleteIngredients(ids) {
      if (ids.length === 0) return
      const { error } = await supabase.from('meal_ingredients').delete().in('id', ids).eq('user_id', userId)
      fail('Removing ingredients', error)
    },

    async setGroceryLink(ingredientIds, groceryItemId) {
      if (ingredientIds.length === 0) return
      const { error } = await supabase
        .from('meal_ingredients')
        .update({ grocery_item_id: groceryItemId })
        .in('id', ingredientIds)
        .eq('user_id', userId)
      fail('Linking to the grocery list', error)
    },

    async linksTo(groceryItemId) {
      const { data, error } = await supabase
        .from('meal_ingredients')
        .select(`${INGREDIENT}, meal_plans!inner(plan_date, slot)`)
        .eq('grocery_item_id', groceryItemId)
        .eq('user_id', userId)
      fail('Loading grocery links', error)
      return (data ?? []).map(row => {
        // A to-one embed; typed loosely by the client, so normalise it here.
        const meal = (Array.isArray(row.meal_plans) ? row.meal_plans[0] : row.meal_plans) as { plan_date: string; slot: string }
        return { ...toIngredient(row), planDate: meal.plan_date, slot: (isMealSlot(meal.slot) ? meal.slot : 'dinner') as MealSlot }
      })
    },

    async unboughtGroceryItems() {
      const { data, error } = await supabase
        .from('grocery_items')
        .select(GROCERY)
        .eq('user_id', userId)
        .eq('purchased', false)
        .order('created_at', { ascending: true })
      fail('Loading the grocery list', error)
      return (data ?? []).map(toGrocery)
    },

    async getGroceryItem(id) {
      const { data, error } = await supabase.from('grocery_items').select(GROCERY).eq('id', id).eq('user_id', userId).maybeSingle()
      fail('Loading a grocery item', error)
      return data ? toGrocery(data) : null
    },

    async insertGroceryItem(row) {
      const { data, error } = await supabase
        .from('grocery_items')
        .insert({
          user_id: userId,
          name: row.name,
          category: row.category,
          quantity: row.quantity,
          base_quantity: row.baseQuantity,
          origin: row.origin,
        })
        .select(GROCERY)
        .single()
      fail('Adding to the grocery list', error)
      return toGrocery(data!)
    },

    async updateGroceryItem(id, patch) {
      const row: Record<string, unknown> = {}
      if (patch.quantity !== undefined) row.quantity = patch.quantity
      if (patch.baseQuantity !== undefined) row.base_quantity = patch.baseQuantity
      if (patch.origin !== undefined) row.origin = patch.origin
      const { error } = await supabase.from('grocery_items').update(row).eq('id', id).eq('user_id', userId)
      fail('Updating the grocery list', error)
    },

    async deleteGroceryItem(id) {
      const { error } = await supabase.from('grocery_items').delete().eq('id', id).eq('user_id', userId)
      fail('Removing from the grocery list', error)
    },

    async categoryOverrides() {
      const { data, error } = await supabase.from('grocery_category_overrides').select('term, category').eq('user_id', userId)
      // A missing overrides table shouldn't stop the list: items just use the keyword lookup.
      if (error) return {}
      return Object.fromEntries((data ?? []).map(o => [o.term, o.category]))
    },
  }
}
