'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
  const [suggestions, setSuggestions] = useState<string[]>([])

  // pet_name থেকে সাজেশন তৈরি
  useEffect(() => {
    if (petName) {
      const base = petName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
      if (base.length >= 3) {
        setSuggestions([
          base,
          `${base}${Math.floor(Math.random() * 100)}`,
          `${base}_${Math.floor(Math.random() * 10)}`
        ])
      }
    }
  }, [petName])

  // Debounce লজিক এবং রিয়েল-টাইম এভেইলেবিলিটি চেক
  useEffect(() => {
    const checkAvailability = async () => {
      if (!username) {
        setIsAvailable(null)
        setError('')
        return
      }

      // ক্লায়েন্ট সাইড ফরম্যাট ভ্যালিডেশন
      const isValidFormat = /^[a-zA-Z0-9_]{3,30}$/.test(username)
      if (!isValidFormat) {
        setError('ইউজারনেম ৩-৩০ অক্ষরের হতে হবে এবং শুধু a-z, A-Z, 0-9, _ ব্যবহার করা যাবে।')
        setIsAvailable(null)
        return
      }

      // রিজার্ভড শব্দ চেক
      if (RESERVED_WORDS.includes(username.toLowerCase())) {
        setError('এই ইউজারনেমটি ব্যবহার করা যাবে না।')
        setIsAvailable(null)
        return
      }

      setError('')
      setIsChecking(true)

      // ডাটাবেসে case-insensitive চেক (ilike ব্যবহার করে)
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', username.replace(/[\\%_]/g, '\\$&'))
        .maybeSingle()

      if (data) {
        setIsAvailable(false) // কেউ আগেই নিয়ে নিয়েছে
      } else {
        setIsAvailable(true) // নামটা ফাঁকা আছে
      }
      setIsChecking(false)
    }

    const timeoutId = setTimeout(() => {
      checkAvailability()
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [username, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAvailable || error || isSubmitting) return

    setIsSubmitting(true)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', userId)

    if (updateError) {
      if (updateError.code === '23505') {
        // Unique constraint violation
        setError('এই নামটা এইমাত্র নেওয়া হয়ে গেছে, অন্য একটা চেষ্টা করুন।')
        setIsAvailable(false)
      } else {
        setError('অপ্রত্যাশিত একটি ত্রুটি হয়েছে। আবার চেষ্টা করুন।')
      }
      setIsSubmitting(false)
    } else {
      router.push('/dashboard')
      router.refresh() // লেআউটের সার্ভার স্টেট আপডেট করার জন্য
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
          Username
        </label>
        <div className="relative">
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. cool_user99"
            className={`w-full px-4 py-3 rounded-lg border ${
              error ? 'border-red-500 focus:ring-red-500' :
              isAvailable ? 'border-green-500 focus:ring-green-500' :
              'border-gray-300 focus:ring-blue-500'
            } focus:outline-none focus:ring-2`}
          />
          <div className="absolute right-3 top-3.5 text-sm">
            {isChecking && <span className="text-gray-400">Checking...</span>}
            {!isChecking && isAvailable === true && <span className="text-green-600 font-medium">Available ✓</span>}
            {!isChecking && isAvailable === false && <span className="text-red-500 font-medium">Already taken ✗</span>}
          </div>
        </div>
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      </div>

      {suggestions.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setUsername(suggestion)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!isAvailable || !!error || isSubmitting}
        className="mt-4 w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Saving...' : 'Complete Setup'}
      </button>
    </form>
  )
}
