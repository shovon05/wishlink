'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { CheckCircle2, Shield, Heart, ArrowRight, Copy, Check } from 'lucide-react'
import MaterialErrorBanner from '@/components/MaterialErrorBanner'

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
  const [error, setError] = useState<unknown | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  const [successData, setSuccessData] = useState<{ reservation_id: string; access_token: string } | null>(null)

  const handleReserve = async (e?: React.FormEvent) => {
    if (e?.preventDefault) {
      e.preventDefault()
    }

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
    setError(null)

    try {
      const { data, error: rpcError } = await supabase.rpc('reserve_gift', {
        p_wishlist_item_id: itemId,
        p_is_anonymous: isAnonymous,
        p_gifter_contact: isAnonymous ? null : sanitizedContact,
      })

      if (rpcError) {
        if (rpcError.message.includes('no longer available')) {
          setError('Someone just reserved this gift moments ago.')
          return
        }
        setError(rpcError)
        return
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
      setError(err)
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
        <div className="w-14 h-14 bg-spruce-light text-spruce rounded-2xl flex items-center justify-center mx-auto border border-spruce/30 md-elevation-1">
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

        {/* Private Tracker Ticket Card */}
        <div className="paper-tag rounded-2xl p-4 sm:p-5 border border-parchment bg-parchment-light/40 space-y-3.5 text-left md-elevation-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-muted">
              Private Tracking Link
            </span>
            <button
              onClick={handleCopySecretLink}
              type="button"
              className="text-xs font-semibold text-caramel hover:text-mocha inline-flex items-center gap-1.5 transition-colors cursor-pointer py-1"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-ink-muted leading-relaxed">
            Save this link or bookmark this page to view shipping updates and delivery addresses when shared.
          </p>

          <Link
            href={reservationUrl}
            className="posh-button-primary w-full py-3 px-4 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <span>Open Delivery Tracker Ticket</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div>
          <Link
            href={`/${username}`}
            className="text-xs text-slate-muted hover:text-ink font-semibold transition-colors py-2 inline-block min-h-[36px]"
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
          className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer min-h-[48px] ${
            isAnonymous
              ? 'border-caramel bg-caramel-light/40 md-elevation-1'
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
          className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer min-h-[48px] ${
            !isAnonymous
              ? 'border-caramel bg-caramel-light/40 md-elevation-1'
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-parchment text-sm bg-white text-ink placeholder:text-slate-muted/60 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors min-h-[44px]"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        </label>
      </div>

      {Boolean(error) && (
        <MaterialErrorBanner
          error={error}
          onDismiss={() => setError(null)}
          onRetry={() => handleReserve()}
          fallbackMessage="Unable to reserve this gift at this time."
        />
      )}

      <button
        type="submit"
        disabled={loading}
        className="posh-button-rose w-full py-3.5 px-4 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50 min-h-[48px]"
      >
        {loading ? 'Reserving gift...' : 'Confirm gift reservation'}
      </button>
    </form>
  )
}
