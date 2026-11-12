'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { CheckCircle2, Shield, Heart, ArrowRight, Copy, Check } from 'lucide-react'

interface Props {
  itemId: string
  itemTitle: string
  username: string
  petName?: string
}

export default function GiftReservationForm({ itemId, itemTitle, username, petName }: Props) {
  const supabase = createClient()
  const recipientName = petName || username

  const [isAnonymous, setIsAnonymous] = useState(true)
  const [contactInfo, setContactInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)

  const [successData, setSuccessData] = useState<{ reservation_id: string; access_token: string } | null>(null)

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault()

    const sanitizedContact = contactInfo.trim()

    if (!isAnonymous && !sanitizedContact) {
      setError('Please provide your name or a short note.')
      return
    }
    if (!isAnonymous && sanitizedContact.length > 200) {
      setError('Note is too long (maximum 200 characters).')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: rpcError } = await supabase.rpc('reserve_gift', {
        p_wishlist_item_id: itemId,
        p_is_anonymous: isAnonymous,
        p_gifter_contact: isAnonymous ? null : sanitizedContact,
      })

      if (rpcError) {
        if (rpcError.message.includes('no longer available')) {
          throw new Error('Someone just reserved this gift moments ago.')
        }
        throw new Error(rpcError.message || 'An unexpected error occurred. Please try again.')
      }

      const result = Array.isArray(data) ? data[0] : data
      if (!result?.reservation_id || !result?.access_token) {
        throw new Error('Failed to retrieve reservation details.')
      }

      try {
        const existingStr = localStorage.getItem('gift_reservations')
        const existingArr = existingStr ? JSON.parse(existingStr) : []
        existingArr.push({
          reservation_id: result.reservation_id,
          access_token: result.access_token,
          item_title: itemTitle || 'Untitled Gift',
          reserved_at: new Date().toISOString(),
        })
        localStorage.setItem('gift_reservations', JSON.stringify(existingArr))
      } catch {
        // LocalStorage access may fail in private windows; non-blocking
      }

      setSuccessData({
        reservation_id: result.reservation_id,
        access_token: result.access_token,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred while reserving the gift.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopySecretLink = async () => {
    if (!successData) return
    const trackerUrl = `${window.location.origin}/reservations/${successData.reservation_id}#token=${successData.access_token}`
    try {
      await navigator.clipboard.writeText(trackerUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      // Fallback
    }
  }

  if (successData) {
    const reservationUrl = `/reservations/${successData.reservation_id}#token=${successData.access_token}`

    return (
      <div className="text-center py-4 space-y-6">
        <div className="w-14 h-14 bg-spruce-light text-spruce rounded-2xl flex items-center justify-center mx-auto border border-spruce/30">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-serif font-bold text-ink">
            Gift Reserved!
          </h3>
          <p className="text-sm text-slate-muted max-w-sm mx-auto leading-relaxed">
            We notified {recipientName}. As soon as they share their private delivery address, it will unlock on your tracking ticket.
          </p>
        </div>

        {/* Action card */}
        <div className="p-4 rounded-2xl bg-parchment-light/40 border border-parchment text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif font-bold text-ink">Your Private Tracking Link</span>
            <button
              onClick={handleCopySecretLink}
              type="button"
              className="inline-flex items-center gap-1 text-xs text-caramel hover:text-mocha font-semibold cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-spruce" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy link'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-muted">
            Bookmark this secret link so you can view the recipient&apos;s address once approved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href={reservationUrl}
            className="flex-1 posh-button-primary inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-sm font-semibold cursor-pointer"
          >
            <span>Open Delivery Tracker</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href={`/${username}`}
            className="inline-flex items-center justify-center py-3.5 px-5 rounded-xl text-sm font-semibold text-slate-muted hover:text-ink hover:bg-parchment-light/60 transition-all border border-parchment"
          >
            Return to registry
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleReserve} className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-serif font-bold text-ink">
          Reserve This Gift
        </h3>
        <p className="text-xs text-slate-muted">
          Locking this item prevents duplicate purchases while keeping your contact details private.
        </p>
      </div>

      <div className="space-y-3">
        {/* Option 1: Anonymous */}
        <label
          onClick={() => setIsAnonymous(true)}
          className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
            isAnonymous
              ? 'border-caramel bg-caramel-light/30 shadow-2xs'
              : 'border-parchment bg-white hover:bg-parchment-light/40 text-slate-muted'
          }`}
        >
          <div className="pt-0.5">
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
              isAnonymous ? 'border-mocha bg-mocha' : 'border-slate-muted/50 bg-white'
            }`}>
              {isAnonymous && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </div>
          <div className="space-y-1">
            <span className="block text-sm font-semibold text-ink flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-caramel" />
              Gift anonymously (Default)
            </span>
            <span className="block text-xs text-slate-muted leading-relaxed">
              {recipientName} will know someone reserved this item, but your identity stays private.
            </span>
          </div>
        </label>

        {/* Option 2: With name */}
        <label
          onClick={() => setIsAnonymous(false)}
          className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
            !isAnonymous
              ? 'border-caramel bg-caramel-light/30 shadow-2xs'
              : 'border-parchment bg-white hover:bg-parchment-light/40 text-slate-muted'
          }`}
        >
          <div className="pt-0.5">
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
              !isAnonymous ? 'border-mocha bg-mocha' : 'border-slate-muted/50 bg-white'
            }`}>
              {!isAnonymous && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </div>
          <div className="space-y-2 flex-1">
            <div>
              <span className="block text-sm font-semibold text-ink flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-ribbon" />
                Include my name or note
              </span>
              <span className="block text-xs text-slate-muted mt-0.5 leading-relaxed">
                Let {recipientName} know this warm gesture is from you.
              </span>
            </div>

            {!isAnonymous && (
              <div className="pt-1">
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Your name or friendly note (e.g. Alex & Sam)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-parchment text-sm bg-white text-ink placeholder:text-slate-muted/60 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        </label>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-ribbon-light border border-ribbon/30 text-ribbon text-xs space-y-1">
          <p>{error}</p>
          {error.includes('moments ago') && (
            <Link href={`/${username}`} className="font-semibold underline inline-block">
              Return to registry
            </Link>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="posh-button-rose w-full py-3.5 px-4 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50"
      >
        {loading ? 'Reserving gift...' : 'Confirm gift reservation'}
      </button>
    </form>
  )
}
