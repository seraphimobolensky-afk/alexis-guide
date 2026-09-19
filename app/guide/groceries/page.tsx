import { groceryTips, groceriesIntro } from '@/lib/content'
import SectionHeader from '@/components/SectionHeader'
import TipList from '@/components/TipList'

export default function GroceriesPage() {
  return (
    <div>
      <SectionHeader
        eyebrow="Section 4"
        title="Planning groceries"
        subtitle={groceriesIntro}
      />
      <TipList tips={groceryTips} />
    </div>
  )
}
