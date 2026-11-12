import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingForm from './OnboardingForm'
import { Sparkles } from 'lucide-react'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch current profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, pet_name')
    .eq('id', user.id)
    .single()

  // If user already claimed a non-temporary username, redirect to dashboard
  if (!profile || !profile.username?.startsWith('user_')) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cotton px-4 py-12">
      <div className="w-full max-w-md paper-tag rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-parchment-light border border-parchment flex items-center justify-center mx-auto text-ink shadow-2xs">
            <Sparkles className="w-6 h-6 text-ribbon stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-ink">
            Claim Your Unique Handle
          </h1>
          <p className="text-xs text-slate-muted max-w-xs mx-auto leading-relaxed">
            Choose your permanent bio-link username. Friends will use this to browse and reserve items from your wishlist.
          </p>
        </div>

        <OnboardingForm userId={user.id} petName={profile.pet_name} />
      </div>
    </main>
  )
}
