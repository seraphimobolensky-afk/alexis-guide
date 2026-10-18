import { createClient } from '@/lib/supabase/server'
import { DEFAULT_RECIPE_EMOJI, type UserRecipe } from '@/lib/userRecipes'

export const USER_RECIPE_COLUMNS = 'id, title, emoji, intro, ingredients, steps'

type UserRecipeRow = { id: string; title: string; emoji: string | null; intro: string | null; ingredients: unknown; steps: unknown }

/** The jsonb columns are checked item by item, so a hand-edited row can't break the page. */
export function toUserRecipe(row: UserRecipeRow): UserRecipe {
  const ingredients = Array.isArray(row.ingredients) ? row.ingredients : []
  const steps = Array.isArray(row.steps) ? row.steps : []
  return {
    id: row.id,
    title: row.title,
    emoji: row.emoji || DEFAULT_RECIPE_EMOJI,
    intro: row.intro,
    ingredients: ingredients
      .filter((i): i is { name: string; quantity?: unknown } => typeof i?.name === 'string' && i.name.trim() !== '')
      .map(i => ({ name: i.name, quantity: typeof i.quantity === 'string' && i.quantity ? i.quantity : null })),
    steps: steps.filter((s): s is string => typeof s === 'string' && s.trim() !== ''),
  }
}

/** Oldest first, so a new recipe lands at the end of "Your recipes". */
export async function getUserRecipes(): Promise<{ recipes: UserRecipe[]; loadError?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { recipes: [] }

  const { data, error } = await supabase
    .from('user_recipes')
    .select(USER_RECIPE_COLUMNS)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
  if (error) {
    console.error('getUserRecipes: fetch failed', error)
    return { recipes: [], loadError: error.message }
  }
  return { recipes: (data ?? []).map(toUserRecipe) }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getUserRecipe(id: string): Promise<UserRecipe | null> {
  if (!UUID.test(id)) return null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_recipes')
    .select(USER_RECIPE_COLUMNS)
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) console.error('getUserRecipe: fetch failed', error)
  return data ? toUserRecipe(data) : null
}
