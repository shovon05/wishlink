'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [errorMsg, setErrorMsg] = useState('')
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingPasskey, setLoadingPasskey] = useState(false)

  const handleGoogleLogin = async () => {
    setErrorMsg('')
    setLoadingGoogle(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw new Error('Google দিয়ে সাইন ইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।')
      }
      // সফল হলে ব্রাউজার নিজে থেকেই Google-এ রিডাইরেক্ট হয়ে যাবে
    } catch (err: any) {
      setErrorMsg(err.message || 'অজানা কোনো সমস্যা হয়েছে, আবার চেষ্টা করুন।')
      setLoadingGoogle(false)
    }
  }

  const handlePasskeyLogin = async () => {
    setErrorMsg('')
    setLoadingPasskey(true)

    try {
      if (!window.PublicKeyCredential) {
        throw new Error('আপনার ডিভাইস বা ব্রাউজার Passkey সাপোর্ট করে না।')
      }

      const { data, error } = await supabase.auth.signInWithPasskey()

      if (error) {
        if (error.message.toLowerCase().includes('cancel') || error.message.includes('NotAllowedError')) {
          throw new Error('আপনি লগইন প্রম্পট বাতিল করেছেন।')
        }
        throw new Error('লগইন ব্যর্থ হয়েছে। এই ডিভাইসে কি কোনো অ্যাকাউন্ট রেজিস্টার করা আছে?')
      }

      if (data?.session) {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'অজানা কোনো সমস্যা হয়েছে, আবার চেষ্টা করুন।')
    } finally {
      setLoadingPasskey(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 bg-white shadow rounded">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome Back</h1>

        {errorMsg && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
            {errorMsg}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loadingGoogle || loadingPasskey}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.4C29.5 34.9 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8H6v6.1C9.7 39.7 16.3 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.5 5.4C40.9 36.6 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z" />
          </svg>
          {loadingGoogle ? 'অপেক্ষা করুন...' : 'Continue with Google'}
        </button>

        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="mx-3 text-sm text-gray-400">অথবা</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <button
          onClick={handlePasskeyLogin}
          disabled={loadingGoogle || loadingPasskey}
          className="w-full bg-black text-white px-4 py-3 rounded font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {loadingPasskey ? 'Verifying...' : 'Sign in with a Passkey'}
        </button>
      </div>
    </div>
  )
}
