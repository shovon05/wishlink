'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, MapPin, Copy, Check, Clock, RefreshCw, AlertCircle, Home } from 'lucide-react'

type Props = {
  params: Promise<{ reservationId: string }>
}

export default function ReservationTrackerPage({ params }: Props) {
  const { reservationId } = use(params)
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const supabase = createClient()

  const [address, setAddress] = useState<{ label: string; full_address: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedAddress, setCopiedAddress] = useState(false)

  const loadAddress = async () => {
    if (!token) {
      setError('Access token is missing from this URL. Please use the complete reservation link.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: rpcError } = await supabase.rpc('get_shared_address', {
        p_reservation_id: reservationId,
        p_access_token: token,
      })

      if (rpcError) throw new Error(rpcError.message)

      if (data && data.length > 0) {
        setAddress({
          label: data[0].address_label,
          full_address: data[0].full_address,
        })
      } else {
        setAddress(null)
      }
    } catch {
      setError('Failed to load reservation details. The link may be invalid or expired.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false
    const init = async () => {
      if (!token) {
        if (!ignore) {
          setError('Access token is missing from this URL. Please use the complete reservation link.')
          setLoading(false)
        }
        return
      }

      try {
        const { data, error: rpcError } = await supabase.rpc('get_shared_address', {
          p_reservation_id: reservationId,
          p_access_token: token,
        })

        if (!ignore) {
          if (rpcError) throw new Error(rpcError.message)
          if (data && data.length > 0) {
            setAddress({
              label: data[0].address_label,
              full_address: data[0].full_address,
            })
          } else {
            setAddress(null)
          }
        }
      } catch {
        if (!ignore) {
          setError('Failed to load reservation details. The link may be invalid or expired.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    init()
    return () => {
      ignore = true
    }
  }, [reservationId, token, supabase])

  const handleCopyAddress = async () => {
    if (!address) return
    try {
      await navigator.clipboard.writeText(address.full_address)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <main className="min-h-screen bg-cotton py-12 px-4 flex justify-center items-start">
      <div className="max-w-lg w-full space-y-6">

        {/* Top bar */}
        <div className="flex items-center justify-between px-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-muted hover:text-ink transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Wishlink</span>
          </Link>

          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-spruce bg-spruce-light px-2.5 py-0.5 rounded-full border border-spruce/20">
            <ShieldCheck className="w-3 h-3 text-spruce" />
            Verified Token Access
          </span>
        </div>

        {/* Parcel Ticket Card */}
        <div className="paper-tag rounded-3xl p-6 sm:p-8 space-y-6">

          <div>
            <span className="text-[11px] font-medium text-slate-muted uppercase tracking-wider block mb-1">
              Parcel Ticket #{reservationId.slice(0, 8)}
            </span>
            <h1 className="text-2xl font-serif font-bold text-ink tracking-tight">
              Gift Delivery Status
            </h1>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-muted">
              <RefreshCw className="w-6 h-6 animate-spin stroke-1" />
              <p className="text-xs">Verifying ticket token...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-ribbon-light border border-ribbon/20 text-ribbon text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>Unable to load address</span>
              </div>
              <p>{error}</p>
            </div>
          ) : address ? (
            <div className="space-y-5">
              {/* Address Unlocked Banner */}
              <div className="p-4 rounded-2xl bg-spruce-light border border-spruce/20 text-spruce space-y-1">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Private Shipping Address Disclosed</span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">
                  The recipient approved this delivery address for your reserved gift. You can now purchase and ship the parcel.
                </p>
              </div>

              {/* Address Display Box */}
              <div className="p-5 rounded-2xl bg-parchment-light/80 border border-parchment space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-ink" />
                    <span className="text-xs font-semibold text-ink">
                      {address.label || 'Shipping Destination'}
                    </span>
                  </div>

                  <button
                    onClick={handleCopyAddress}
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-medium text-ribbon hover:text-ribbon-hover cursor-pointer"
                  >
                    {copiedAddress ? <Check className="w-3.5 h-3.5 text-spruce" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAddress ? 'Copied' : 'Copy address'}</span>
                  </button>
                </div>

                <p className="text-sm text-ink whitespace-pre-wrap font-sans leading-relaxed pt-1">
                  {address.full_address}
                </p>
              </div>

              <p className="text-xs text-slate-muted leading-relaxed">
                Remember to keep this tracking URL confidential. The recipient&apos;s address is only visible through this access token.
              </p>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-parchment-light rounded-2xl flex items-center justify-center mx-auto text-slate-muted border border-parchment">
                <Clock className="w-7 h-7 stroke-1" />
              </div>

              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="text-base font-semibold text-ink">
                  Awaiting Recipient Address
                </h3>
                <p className="text-xs text-slate-muted leading-relaxed">
                  The recipient was notified of your gift reservation. As soon as they select their preferred delivery address, it will appear here.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={loadAddress}
                  type="button"
                  className="inline-flex items-center gap-2 bg-ink text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-ink/90 active:scale-98 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check Status Again</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </main>
  )
}
