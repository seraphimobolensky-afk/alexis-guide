import { createClient } from '@/lib/supabase/server'
import { cleaningTasks, cleaningIntro } from '@/lib/content'
import SectionHeader from '@/components/SectionHeader'
import ChecklistCard from '@/components/ChecklistCard'
import styles from './cleaning.module.css'

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
      <div className={styles.grid}>
        {cleaningTasks.map(task => (
          <ChecklistCard
            key={task.key}
            taskKey={task.key}
            icon={task.icon}
            title={task.title}
            frequency={task.frequency}
            bullets={task.bullets}
            initialChecked={!!completions[task.key]}
          />
        ))}
      </div>
    </div>
  )
}
