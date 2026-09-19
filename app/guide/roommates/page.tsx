import { roommateTips, roommatesIntro } from '@/lib/content'
import SectionHeader from '@/components/SectionHeader'
import TipList from '@/components/TipList'

export default function RoommatesPage() {
  return (
    <div>
      <SectionHeader
        eyebrow="Section 6"
        title="Roommates"
        subtitle={roommatesIntro}
      />
      <TipList tips={roommateTips} />
    </div>
  )
}
