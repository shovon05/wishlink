'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Props {
  itemId: string
  itemTitle: string
  username: string
}

export default function GiftReservationForm({ itemId, itemTitle, username }: Props) {
  const supabase = createClient()

  const [isAnonymous, setIsAnonymous] = useState(true)
  const [contactInfo, setContactInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [successData, setSuccessData] = useState<{ reservation_id: string; access_token: string } | null>(null)

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault()

    // স্যানিটাইজেশন এবং ভ্যালিডেশন
    const sanitizedContact = contactInfo.trim()

    if (!isAnonymous && !sanitizedContact) {
      setError('Please provide your name or contact info.')
      return
    }
    if (!isAnonymous && sanitizedContact.length > 200) {
      setError('Contact info is too long (maximum 200 characters).')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: rpcError } = await supabase.rpc('reserve_gift', {
        p_wishlist_item_id: itemId,
        p_is_anonymous: isAnonymous,
        p_gifter_contact: isAnonymous ? null : sanitizedContact
      })

      if (rpcError) {
        if (rpcError.message.includes('no longer available')) {
          throw new Error('Sorry, someone just reserved this gift moments ago!')
        }
        throw new Error(rpcError.message || 'An unexpected error occurred. Please try again.')
      }

      const result = Array.isArray(data) ? data[0] : data
      if (!result?.reservation_id || !result?.access_token) {
        throw new Error('Failed to retrieve reservation details.')
      }

      const existingStr = localStorage.getItem('gift_reservations')
      const existingArr = existingStr ? JSON.parse(existingStr) : []
      existingArr.push({
        reservation_id: result.reservation_id,
        access_token: result.access_token,
        item_title: itemTitle || 'Untitled Gift',
        reserved_at: new Date().toISOString()
      })
      localStorage.setItem('gift_reservations', JSON.stringify(existingArr))

      setSuccessData({
        reservation_id: result.reservation_id,
        access_token: result.access_token
      })

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (successData) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">🎉 You've reserved this gift!</h3>
        <p className="text-gray-600 mb-8">We've notified them. Check back here once they share their delivery address.</p>
        <div className="flex flex-col gap-3">
          <Link href={`/reservations/${successData.reservation_id}?token=${successData.access_token}`} className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition">
            View my reservation
          </Link>
          <Link href={`/${username}`} className="text-gray-500 hover:text-gray-800 font-medium py-2">
            Return to {username}'s profile
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleReserve} className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">How would you like to gift?</h3>
        <div className="space-y-3">
          <label className={`flex items-start p-4 border rounded-xl cursor-pointer transition-colors ${isAnonymous ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
            <input type="radio" checked={isAnonymous} onChange={() => setIsAnonymous(true)} className="mt-1 w-4 h-4 text-blue-600" />
            <div className="ml-3">
              <span className="block font-medium text-gray-900">Gift anonymously (Default)</span>
              <span className="block text-sm text-gray-500 mt-1">They won't know who reserved it.</span>
            </div>
          </label>

          <label className={`flex items-start p-4 border rounded-xl cursor-pointer transition-colors ${!isAnonymous ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
            <input type="radio" checked={!isAnonymous} onChange={() => setIsAnonymous(false)} className="mt-1 w-4 h-4 text-blue-600" />
            <div className="ml-3 w-full">
              <span className="block font-medium text-gray-900">Gift with my name</span>
              <span className="block text-sm text-gray-500 mt-1 mb-3">Let them know it's from you.</span>

              {!isAnonymous && (
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Your name or contact (e.g. Shovon)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          {error}
          {error.includes('moments ago') && (
            <Link href={`/${username}`} className="block mt-2 font-medium underline">Return to profile</Link>
          )}
        </div>
      )}

      <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-medium py-3.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition">
        {loading ? 'Confirming...' : 'Confirm Gift'}
      </button>
    </form>
  )
}
