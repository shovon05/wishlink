'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, ArrowRight } from 'lucide-react'

const RESERVED_WORDS = [
  'api', 'auth', 'login', 'logout', 'signup', 'register',
  'settings', 'admin', 'dashboard', 'onboarding',
  'wishlist', 'help', 'support', 'about', 'privacy',
  'terms', 'contact', 'notifications', 'reservations', 'mfa-challenge'
]

export default function OnboardingForm({ userId, petName }: { userId: string, petName: string | null }) {
  const router = useRouter()
  const supabase = createClient()

  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const suggestions = useMemo(() => {
    if (!petName) return []
    const base = petName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    if (base.length < 3) return []
    return [
      base,
      `${base}42`,
      `${base}_7`
    ]
  }, [petName])

  useEffect(() => {
    const checkAvailability = async () => {
      if (!username) {
        setIsAvailable(null)
        setError('')
        return
      }

      // Format validation: 3-30 letters, numbers, underscores
      const isValidFormat = /^[a-zA-Z0-9_]{3,30}$/.test(username)
      if (!isValidFormat) {
        setError('Username must be 3-30 characters (letters, numbers, underscores only).')
        setIsAvailable(null)
        return
      }

      // Guard against reserved user_* prefix
      if (username.toLowerCase().startsWith('user_')) {
        setError('Usernames cannot begin with "user_" as that prefix is reserved.')
        setIsAvailable(null)
        return
      }

      // Check against reserved route keywords
      if (RESERVED_WORDS.includes(username.toLowerCase())) {
        setError('This handle is a reserved system word. Please choose another.')
        setIsAvailable(null)
        return
      }

      setError('')
      setIsChecking(true)

      const { data } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', username.replace(/[\\%_]/g, '\\$&'))
        .maybeSingle()

      if (data) {
        setIsAvailable(false)
      } else {
        setIsAvailable(true)
      }
      setIsChecking(false)
    }

    const timeoutId = setTimeout(() => {
      checkAvailability()
    }, 400)

    return () => clearTimeout(timeoutId)
  }, [username, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAvailable || error || isSubmitting) return

    setIsSubmitting(true)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username: username.toLowerCase().trim() })
      .eq('id', userId)

    if (updateError) {
      if (updateError.code === '23505') {
        setError('This handle was just claimed by someone else. Please try another.')
        setIsAvailable(false)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
      setIsSubmitting(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="username" className="block text-xs font-serif font-bold text-ink mb-1.5">
          Your Wishlink URL
        </label>
        <div className="relative flex items-center rounded-2xl border border-parchment bg-white overflow-hidden shadow-2xs focus-within:border-caramel focus-within:ring-1 focus-within:ring-caramel transition-colors">
          <span className="pl-3.5 pr-1 text-xs font-semibold text-slate-muted select-none">
            wishlink.me/
          </span>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, ''))}
            placeholder="yourname"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck="false"
            className="flex-1 px-1 py-3 text-sm text-ink placeholder:text-slate-muted/50 focus:outline-none bg-transparent"
          />

          <div className="pr-3.5 flex items-center">
            {isChecking && <Loader2 className="w-4 h-4 animate-spin text-caramel" />}
            {!isChecking && isAvailable === true && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-spruce bg-spruce-light px-2.5 py-0.5 rounded-full border border-spruce/30">
                <Check className="w-3 h-3 stroke-[2.5]" />
                Available
              </span>
            )}
            {!isChecking && isAvailable === false && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ribbon bg-ribbon-light px-2.5 py-0.5 rounded-full border border-ribbon/30">
                <X className="w-3 h-3 stroke-[2.5]" />
                Taken
              </span>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-1.5 text-xs text-ribbon font-medium">
            {error}
          </p>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-muted block">
            Suggested handles:
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setUsername(suggestion)}
                className="px-3 py-1 text-xs font-semibold bg-parchment-light border border-parchment hover:border-caramel/40 text-ink rounded-full transition-all cursor-pointer shadow-2xs"
              >
                @{suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!isAvailable || !!error || isSubmitting}
        className="posh-button-primary w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Claiming Handle...</span>
          </>
        ) : (
          <>
            <span>Claim My Wishlink</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  )
}
