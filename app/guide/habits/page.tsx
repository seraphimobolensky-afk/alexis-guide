import SectionHeader from '@/components/SectionHeader'
import HabitChartPanel from '@/components/HabitChartPanel'
import { getHabitsPageData } from './data'
import styles from './habits.module.css'

export default async function HabitsPage() {
  const { cleaningHabits, customHabits, entriesByHabit } = await getHabitsPageData()

  return (
    <div>
      <SectionHeader
        eyebrow="Your progress"
        title="Habits"
        subtitle="Track your cleaning streaks and anything else you want to build into a routine."
      />

      <div className={styles.panels}>
        <HabitChartPanel
          title="Cleaning habits"
          storageKeyPrefix="habitsChart:cleaning"
          habits={cleaningHabits}
          entriesByHabit={entriesByHabit}
          manageable={false}
          group="cleaning"
        />
        <HabitChartPanel
          title="My habits"
          storageKeyPrefix="habitsChart:custom"
          habits={customHabits}
          entriesByHabit={entriesByHabit}
          manageable
          group="custom"
        />
      </div>
    </div>
  )
}
