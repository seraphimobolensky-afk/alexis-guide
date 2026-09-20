import Link from 'next/link'
import { cleaningTasks, cleaningIntro } from '@/lib/content'
import SectionHeader from '@/components/SectionHeader'
import CleaningList from '@/components/CleaningList'
import { getCleaningHabitStatuses } from './data'
import styles from './cleaning.module.css'

export default async function CleaningPage() {
  const { statuses, debugError } = await getCleaningHabitStatuses()

  return (
    <div>
      <SectionHeader
        eyebrow="Section 1"
        title="Cleaning schedules"
        subtitle={cleaningIntro}
      />
      <Link href="/guide/habits" className={`${styles.progressLink} raised-sm`}>
        See your progress →
      </Link>
      <CleaningList tasks={cleaningTasks} statuses={statuses} debugError={debugError} />
    </div>
  )
}
