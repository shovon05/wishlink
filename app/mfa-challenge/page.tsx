'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react'

export default function MfaChallengePage() {
  const supabase = createClient()
  const router = useRouter()

  const [factorId, setFactorId] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      const { data, error: listError } = await supabase.auth.mfa.listFactors()
      const factor = data?.totp?.find((f) => f.status === 'verified')

      if (listError || !factor) {
        router.replace('/dashboard')
        return
      }

      setFactorId(factor.id)
      setReady(true)
    }
    init()
  }, [supabase, router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6 || loading) return

    setLoading(true)
    setError('')

    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
      if (challengeError) throw challengeError

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      })
      if (verifyError) throw verifyError

      router.replace('/dashboard')
      router.refresh()
    } catch {
      setError('Incorrect verification code. Please check your authenticator app and try again.')
      setCode('')
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-cotton text-slate-muted gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-ink" />
        <span className="text-xs">Preparing security challenge...</span>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-cotton px-4 py-12">
      <div className="w-full max-w-sm paper-tag rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-spruce-light border border-spruce/30 flex items-center justify-center mx-auto text-spruce shadow-2xs">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-ink">
            Two-Factor Challenge
          </h1>
          <p className="text-xs text-slate-muted leading-relaxed">
            Enter the 6-digit verification code from your authenticator application (Google Authenticator, 1Password, or Authy).
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-ribbon-light border border-ribbon/20 text-ribbon text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="000000"
              className="w-full text-center text-3xl font-mono tracking-[0.4em] py-3.5 border border-parchment rounded-2xl bg-white text-ink placeholder:text-slate-muted/30 focus:outline-none focus:border-ink shadow-2xs transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={code.length !== 6 || loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-ink text-white hover:bg-ink/90 active:scale-98 disabled:opacity-50 py-3.5 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify & Continue</span>
            )}
          </button>
        </form>

        <form action="/auth/signout" method="post" className="text-center pt-2 border-t border-parchment">
          <button
            type="submit"
            className="text-xs font-medium text-slate-muted hover:text-ink transition-colors cursor-pointer"
          >
            Sign out of this session
          </button>
        </form>
      </div>
    </main>
  )
}
