'use server'
import { createClient } from '@/lib/supabase/server'

export async function toggleChecklist(section: string, itemKey: string, completed: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('checklist_completions').upsert({
    user_id: user.id,
    section,
    item_key: itemKey,
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  }, { onConflict: 'user_id,section,item_key' })
}
