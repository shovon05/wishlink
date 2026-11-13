'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MaterialErrorBanner from '@/components/MaterialErrorBanner'
import { Gift, Lock, ArrowLeft, Fingerprint, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingPasskey, setLoadingPasskey] = useState(false)
  const [errorMsg, setErrorMsg] = useState<unknown>(null)

  const handleGoogleLogin = async () => {
    setErrorMsg(null)
    setLoadingGoogle(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        setErrorMsg(error)
      }
    } catch (err) {
      setErrorMsg(err)
      setLoadingGoogle(false)
    }
  }

  const handlePasskeyLogin = async () => {
    setErrorMsg(null)
    setLoadingPasskey(true)

    try {
      if (typeof window === 'undefined' || !window.PublicKeyCredential) {
        throw new Error('Your browser or device does not currently support Passkey authentication.')
      }

      // Supabase Passwordless Passkey Login
      // Prompts the browser's credential manager (Bitwarden, 1Password, Touch ID, Face ID, YubiKey)
      // to select the user's enrolled passkey and authenticate with zero passwords.
      const { data, error } = await supabase.auth.signInWithPasskey()

      if (error) {
        setErrorMsg(error)
        return
      }

      if (data?.session) {
        router.push('/dashboard')
      }
    } catch (err) {
      setErrorMsg(err)
    } finally {
      setLoadingPasskey(false)
    }
  }

  return (
    <main className="min-h-screen bg-cotton flex flex-col justify-between items-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Subtle luxury ambient glow */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-gradient-to-b from-blush/30 via-parchment/20 to-transparent blur-3xl opacity-70" 
      />

      {/* Top Header / Back Link */}
      <header className="w-full max-w-md flex items-center justify-between z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-muted hover:text-ink transition-colors px-3 py-2 rounded-full hover:bg-parchment-light/80 border border-transparent hover:border-parchment min-h-[40px]"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Return to Wishlink</span>
        </Link>
        <span className="text-[11px] font-mono tracking-widest uppercase text-caramel font-semibold">
          Studio Access
        </span>
      </header>

      {/* Main Auth Container */}
      <div className="w-full max-w-md my-auto py-6 z-10">
        <div className="paper-tag rounded-3xl p-6 sm:p-9 space-y-7 relative border border-parchment md-elevation-2 bg-white">
          
          {/* Bespoke Crest & Emblem */}
          <div className="text-center space-y-3">
            <div className="inline-flex relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-mocha to-ink text-cotton flex items-center justify-center mx-auto shadow-md border border-caramel/30">
                <Gift className="w-7 h-7 text-blush stroke-[2]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-caramel text-white flex items-center justify-center shadow-xs border border-white">
                <Sparkles className="w-2.5 h-2.5" />
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink tracking-tight">
                {activeTab === 'signin' ? 'Welcome Back' : 'Create Your Wishlink'}
              </h1>
              <p className="text-xs text-slate-muted leading-relaxed max-w-xs mx-auto">
                {activeTab === 'signin'
                  ? 'Access your bespoke private registry and gift management dashboard.'
                  : 'Claim your exclusive handle and curate wishlist items from any store worldwide.'}
              </p>
            </div>
          </div>

          {/* Segmented Auth Selector */}
          <div 
            role="tablist" 
            aria-label="Authentication Options"
            className="grid grid-cols-2 p-1 rounded-2xl bg-parchment-light/70 border border-parchment text-xs font-semibold"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'signin'}
              onClick={() => { setActiveTab('signin'); setErrorMsg(null) }}
              className={`py-2 px-3 rounded-xl transition-all cursor-pointer text-center min-h-[40px] ${
                activeTab === 'signin'
                  ? 'bg-white text-ink shadow-xs font-bold border border-parchment/60'
                  : 'text-slate-muted hover:text-ink'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'signup'}
              onClick={() => { setActiveTab('signup'); setErrorMsg(null) }}
              className={`py-2 px-3 rounded-xl transition-all cursor-pointer text-center min-h-[40px] ${
                activeTab === 'signup'
                  ? 'bg-white text-ink shadow-xs font-bold border border-parchment/60'
                  : 'text-slate-muted hover:text-ink'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Banner with Material diagnostics */}
          {Boolean(errorMsg) && (
            <MaterialErrorBanner
              error={errorMsg}
              onDismiss={() => setErrorMsg(null)}
              onRetry={handlePasskeyLogin}
              fallbackMessage="Authentication could not be completed."
            />
          )}

          {/* Authentication Actions */}
          <div className="space-y-3.5">
            {/* 1. Primary Passkey / Passwordless Login Button */}
            <button
              onClick={handlePasskeyLogin}
              disabled={loadingGoogle || loadingPasskey}
              type="button"
              className="posh-button-primary w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl text-sm font-semibold active:scale-98 disabled:opacity-50 cursor-pointer border border-mocha/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel min-h-[48px] shadow-sm"
            >
              <Fingerprint className="w-5 h-5 text-blush stroke-[2.2]" />
              <span>
                {loadingPasskey ? 'Waiting for Authenticator / Password Manager...' : 'Sign in with Passkey / Bitwarden'}
              </span>
            </button>

            {/* Elegant Divider */}
            <div className="relative py-1.5 flex items-center justify-center">
              <div className="w-full border-t border-parchment" />
              <span className="bg-white px-3 text-[10px] font-semibold text-caramel uppercase tracking-widest font-mono">
                or continue with
              </span>
            </div>

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loadingGoogle || loadingPasskey}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white border border-parchment hover:border-caramel/50 text-ink px-5 py-3.5 rounded-2xl text-sm font-semibold hover:bg-parchment-light/40 disabled:opacity-50 transition-all md-elevation-1 cursor-pointer active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel min-h-[48px]"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.4C29.5 34.9 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8H6v6.1C9.7 39.7 16.3 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.5 5.4C40.9 36.6 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z" />
              </svg>
              <span>
                {loadingGoogle 
                  ? 'Connecting with Google...' 
                  : activeTab === 'signin' ? 'Continue with Google' : 'Sign Up with Google'}
              </span>
            </button>
          </div>

          {/* Privacy Guarantee Seal */}
          <div className="pt-2 border-t border-parchment/60 flex items-center justify-center gap-2 text-[11px] text-slate-muted">
            <Lock className="w-3.5 h-3.5 text-caramel shrink-0" />
            <span>Encrypted zero-password authentication</span>
          </div>
        </div>

        {/* Footnote reassurance */}
        <p className="mt-6 text-center text-xs text-slate-muted">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="text-ink hover:underline font-medium">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-ink hover:underline font-medium">Privacy Policy</Link>.
        </p>
      </div>

      {/* Footer Branding */}
      <footer className="w-full max-w-md text-center py-4 text-[11px] text-slate-muted">
        <span>Wishlink &middot; Bespoke Private Registry</span>
      </footer>
    </main>
  )
}
