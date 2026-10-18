import { notFound } from 'next/navigation'
import SectionHeader from '@/components/SectionHeader'
import RecipeForm from '@/components/RecipeForm'
import { getUserRecipe } from '../../data'

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const recipe = await getUserRecipe(id)
  if (!recipe) notFound()

  return (
    <div>
      <SectionHeader eyebrow="Recipes" title={`Edit ${recipe.title}`} />
      <RecipeForm recipe={recipe} />
    </div>
  )
}
