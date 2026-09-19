import { lifeBalanceTips, lifeIntro } from '@/lib/content'
import SectionHeader from '@/components/SectionHeader'
import TipList from '@/components/TipList'

export default function LifePage() {
  return (
    <div>
      <SectionHeader
        eyebrow="Section 7"
        title="Life balance"
        subtitle={lifeIntro}
      />
      <TipList tips={lifeBalanceTips} />
    </div>
  )
}
