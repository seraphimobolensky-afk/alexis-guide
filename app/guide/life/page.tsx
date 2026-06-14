import { lifeBalanceTips } from '@/lib/content'
import SectionHeader from '@/components/SectionHeader'
import TipList from '@/components/TipList'

export default function LifePage() {
  return (
    <div>
      <SectionHeader
        eyebrow="Section 7"
        title="Life balance"
        subtitle="The most important section. Living abroad by yourself can be extremely fun — and also, at times, lonely. These tips will help."
      />
      <TipList tips={lifeBalanceTips} />
    </div>
  )
}
