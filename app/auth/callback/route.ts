import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard'
  // Validate redirect destination to prevent open redirect vulnerabilities
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.startsWith('/\\')
    ? rawNext
    : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && sessionData?.user) {
      // Sync Google OAuth avatar and name to profiles table if missing
      const user = sessionData.user
      const meta = user.user_metadata || {}
      const avatar = meta.avatar_url || meta.picture || null
      const fullName = meta.full_name || meta.name || null

      if (avatar || fullName) {
        try {
          const updatePayload: Record<string, string> = {}
          if (avatar) updatePayload.avatar_url = avatar

          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('pet_name')
            .eq('id', user.id)
            .maybeSingle()

          if (!existingProfile?.pet_name && fullName) {
            updatePayload.pet_name = fullName
          }

          if (Object.keys(updatePayload).length > 0) {
            await supabase
              .from('profiles')
              .update(updatePayload)
              .eq('id', user.id)
          }
        } catch (syncErr) {
          console.warn('OAuth profile sync notice:', syncErr)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('OAuth callback error:', error?.message)
  } else {
    console.error('OAuth callback: no code param received')
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
