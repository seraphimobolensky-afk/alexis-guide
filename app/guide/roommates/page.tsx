import { roommateTips } from '@/lib/content'
import SectionHeader from '@/components/SectionHeader'
import TipList from '@/components/TipList'

export default function RoommatesPage() {
  return (
    <div>
      <SectionHeader
        eyebrow="Section 6"
        title="Roommates"
        subtitle="Especially important for you since you'll be sharing with multiple people. I've only lived with one roommate — and it felt like four."
      />
      <TipList tips={roommateTips} />
    </div>
  )
}
