'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Gift, KeyRound, ShieldCheck, ArrowLeft, AlertCircle } from 'lucide-react'

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
        throw new Error('Google sign-in was interrupted. Please try again.')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
      setErrorMsg(message)
      setLoadingGoogle(false)
    }
  }

  const handlePasskeyLogin = async () => {
    setErrorMsg('')
    setLoadingPasskey(true)

    try {
      if (!window.PublicKeyCredential) {
        throw new Error('Your current device or browser does not support Passkey authentication.')
      }

      const { data, error } = await supabase.auth.signInWithPasskey()

      if (error) {
        if (error.message.toLowerCase().includes('cancel') || error.message.includes('NotAllowedError')) {
          throw new Error('Passkey sign-in prompt was cancelled.')
        }
        throw new Error('Passkey not recognized. Have you enrolled a passkey on this device yet?')
      }

      if (data?.session) {
        router.push('/dashboard')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during passkey sign-in.'
      setErrorMsg(message)
    } finally {
      setLoadingPasskey(false)
    }
  }

  return (
    <main className="min-h-screen bg-cotton flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Back link */}
        <div className="text-left">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Wishlink</span>
          </Link>
        </div>

        {/* Auth Card */}
        <div className="paper-tag rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-parchment-light border border-parchment flex items-center justify-center mx-auto text-ink shadow-2xs">
              <Gift className="w-6 h-6 text-ribbon stroke-[2.2]" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-ink">
              Welcome to Wishlink
            </h1>
            <p className="text-xs text-slate-muted leading-relaxed">
              Passwordless by design. Sign in securely using your Google account or biometric passkey.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-ribbon-light border border-ribbon/20 text-ribbon text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3 pt-1">
            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={loadingGoogle || loadingPasskey}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white border border-parchment text-ink px-4 py-3 rounded-xl text-sm font-semibold hover:bg-parchment-light hover:border-slate-muted/40 disabled:opacity-50 transition-all shadow-xs cursor-pointer active:scale-98"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.4C29.5 34.9 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8H6v6.1C9.7 39.7 16.3 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.5 5.4C40.9 36.6 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z" />
              </svg>
              <span>{loadingGoogle ? 'Connecting with Google...' : 'Continue with Google'}</span>
            </button>

            <div className="relative py-2 flex items-center justify-center">
              <div className="w-full border-t border-parchment" />
              <span className="bg-white px-3 text-[11px] font-medium text-slate-muted uppercase tracking-wider absolute">
                or passkey
              </span>
            </div>

            {/* Passkey Login */}
            <button
              onClick={handlePasskeyLogin}
              disabled={loadingGoogle || loadingPasskey}
              type="button"
              className="w-full flex items-center justify-center gap-2.5 bg-ink text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-ink/90 active:scale-98 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-cotton stroke-[2.2]" />
              <span>{loadingPasskey ? 'Verifying biometric passkey...' : 'Sign in with Passkey'}</span>
            </button>
          </div>

          <div className="pt-2 text-center">
            <span className="text-[11px] text-slate-muted inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-spruce" />
              Encrypted biometric & OAuth authentication
            </span>
          </div>
        </div>

      </div>
    </main>
  )
}
