import { uniTips } from '@/lib/content'
import SectionHeader from '@/components/SectionHeader'
import TipList from '@/components/TipList'

export default function UniPage() {
  return (
    <div>
      <SectionHeader
        eyebrow="Section 8"
        title="Uni tips"
        subtitle="Uni is different from high school in a lot of ways. Here's what I wish I'd known."
      />
      <TipList tips={uniTips} />
    </div>
  )
}
