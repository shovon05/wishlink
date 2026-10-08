import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingForm from './OnboardingForm'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // ইউজারের বর্তমান প্রোফাইল ফেচ করা
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, pet_name')
    .eq('id', user.id)
    .single()

  // ইউজারনেম যদি 'user_' দিয়ে শুরু না হয়, তার মানে সে আগেই নাম সেট করেছে
  if (!profile || !profile.username?.startsWith('user_')) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose your username</h1>
          <p className="text-gray-500 text-sm">
            Please select a unique username for your profile.
          </p>
        </div>

        <OnboardingForm userId={user.id} petName={profile.pet_name} />
      </div>
    </main>
  )
}
