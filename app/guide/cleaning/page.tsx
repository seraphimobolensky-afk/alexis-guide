import { cleaningTasks, cleaningIntro } from '@/lib/content'
import SectionHeader from '@/components/SectionHeader'
import CleaningList from '@/components/CleaningList'
import { getCleaningHabitStatuses } from './data'

export default async function CleaningPage() {
  const statuses = await getCleaningHabitStatuses()

  return (
    <div>
      <SectionHeader
        eyebrow="Section 1"
        title="Cleaning schedules"
        subtitle={cleaningIntro}
      />
      <CleaningList tasks={cleaningTasks} statuses={statuses} />
    </div>
  )
}
