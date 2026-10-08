import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  // 303: POST এর পর GET হিসেবে /login এ রিডাইরেক্ট
  return NextResponse.redirect(new URL('/login', request.url), { status: 303 })
}
