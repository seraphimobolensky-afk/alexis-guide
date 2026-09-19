import { createClient } from '@/lib/supabase/server'
import { cleaningTasks, cleaningIntro } from '@/lib/content'
import SectionHeader from '@/components/SectionHeader'
import CleaningList from '@/components/CleaningList'

export default async function CleaningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const completions: Record<string, boolean> = {}
  if (user) {
    const { data } = await supabase
      .from('checklist_completions')
      .select('item_key, completed')
      .eq('user_id', user.id)
      .eq('section', 'cleaning')
    data?.forEach(r => { completions[r.item_key] = r.completed })
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Section 1"
        title="Cleaning schedules"
        subtitle={cleaningIntro}
      />
      <CleaningList tasks={cleaningTasks} completions={completions} />
    </div>
  )
}
