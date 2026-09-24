import { createClient } from '@/lib/supabase/server'

export interface GroceryItem {
  id: string
  name: string
  category: string | null
  quantity: string | null
  purchased: boolean
  purchasedAt: string | null
  createdAt: string
}

export interface GroceryPageData {
  items: GroceryItem[]
  /** Normalised item name → category the user moved it to before. */
  overrides: Record<string, string>
  loadError?: string
}

export async function getGroceryPageData(): Promise<GroceryPageData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { items: [], overrides: {} }

  const [itemsRes, overridesRes] = await Promise.all([
    supabase
      .from('grocery_items')
      .select('id, name, category, quantity, purchased, purchased_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    supabase.from('grocery_category_overrides').select('term, category').eq('user_id', user.id),
  ])

  if (itemsRes.error) {
    console.error('getGroceryPageData: items fetch failed', itemsRes.error)
    return { items: [], overrides: {}, loadError: [itemsRes.error.code, itemsRes.error.message].filter(Boolean).join(' — ') }
  }
  // A missing overrides table (SQL not run yet) shouldn't take the list down
  // with it — the list just won't remember manual category moves.
  if (overridesRes.error) console.error('getGroceryPageData: overrides fetch failed', overridesRes.error)

  return {
    items: (itemsRes.data ?? []).map(i => ({
      id: i.id,
      name: i.name,
      category: i.category,
      quantity: i.quantity,
      purchased: i.purchased,
      purchasedAt: i.purchased_at,
      createdAt: i.created_at,
    })),
    overrides: Object.fromEntries((overridesRes.data ?? []).map(o => [o.term, o.category])),
  }
}
