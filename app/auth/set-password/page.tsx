import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SetPasswordForm from './SetPasswordForm'

export default async function SetPasswordPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <SetPasswordForm />
}
