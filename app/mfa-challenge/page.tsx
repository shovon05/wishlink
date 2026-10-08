'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

      // 2FA চালু না থাকলে এই পেজের দরকার নেই
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
      setError('Incorrect code, please try again.')
      setCode('')
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">
        Loading...
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Two-Factor Verification</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter the 6-digit code from your authenticator app.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="000000"
            className="w-full text-center text-3xl tracking-[0.5em] py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={code.length !== 6 || loading}
            className="w-full bg-black text-white font-medium py-3 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <form action="/auth/signout" method="post" className="mt-4 text-center">
          <button className="text-sm text-gray-500 hover:text-gray-900">Sign out</button>
        </form>
      </div>
    </main>
  )
}
