import SectionHeader from '@/components/SectionHeader'
import RecipeForm from '@/components/RecipeForm'

export default function NewRecipePage() {
  return (
    <div>
      <SectionHeader
        eyebrow="Recipes"
        title="Add your own recipe"
        subtitle="It shows up with the other recipes and in the meal planner’s suggestions."
      />
      <RecipeForm />
    </div>
  )
}
