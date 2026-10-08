import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Supabase Middleware ক্লায়েন্ট তৈরি করা
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ইউজারের বর্তমান সেশন এবং MFA লেভেল চেক করা
  const { data: { user } } = await supabase.auth.getUser()
  const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

  // যেসব পেজ প্রটেক্টেড রাখতে চান (যেমন dashboard এবং onboarding)
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                           request.nextUrl.pathname.startsWith('/onboarding')

  if (isProtectedRoute) {
    // ১. ইউজার লগইন করা না থাকলে login পেজে পাঠাবে
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // ২. ইউজার লগইন করা, কিন্তু তার 2FA (MFA) ভেরিফাই করা বাকি থাকলে mfa-challenge পেজে পাঠাবে
    if (mfaData?.nextLevel === 'aal2' && mfaData?.currentLevel !== 'aal2') {
      const url = request.nextUrl.clone()
      url.pathname = '/mfa-challenge'
      return NextResponse.redirect(url)
    }
  }

  // লগইন করা ইউজার যদি ভুলে আবার login পেজে চলে আসে এবং তার 2FA বাকি থাকে, তবে তাকে mfa-challenge এ পাঠাবে
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    if (mfaData?.nextLevel === 'aal2' && mfaData?.currentLevel !== 'aal2') {
      const url = request.nextUrl.clone()
      url.pathname = '/mfa-challenge'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

// Next.js কে বলে দেওয়া কোন রুটগুলোতে এই মিডলওয়্যারটি রান করবে (স্ট্যাটিক ফাইল বাদে প্রায় সব রুটে)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
