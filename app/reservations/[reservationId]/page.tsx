'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, MapPin, Copy, Check, Clock, RefreshCw, Home, Lock } from 'lucide-react'
import MaterialErrorBanner from '@/components/MaterialErrorBanner'

type Props = {
  params: Promise<{ reservationId: string }>
}

export default function ReservationTrackerPage({ params }: Props) {
  const { reservationId } = use(params)
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [token, setToken] = useState<string | null>(null)
  const [address, setAddress] = useState<{ label: string; full_address: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown | null>(null)
  const [copiedAddress, setCopiedAddress] = useState(false)

  const fetchAddress = async (tokenValue: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: rpcError } = await supabase.rpc('get_shared_address', {
        p_reservation_id: reservationId,
        p_access_token: tokenValue,
      })

      if (rpcError) {
        setError(rpcError)
        return
      }

      if (data && data.length > 0) {
        setAddress({
          label: data[0].address_label,
          full_address: data[0].full_address,
        })
      } else {
        setAddress(null)
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    const loadData = async () => {
      let resolvedToken: string | null = null

      if (typeof window !== 'undefined') {
        const hash = window.location.hash
        if (hash && hash.includes('token=')) {
          const match = hash.match(/token=([^&]+)/)
          if (match && match[1]) {
            resolvedToken = decodeURIComponent(match[1])
          }
        }
      }

      if (!resolvedToken) {
        resolvedToken = searchParams.get('token')
      }

      if (!resolvedToken) {
        if (!ignore) {
          setError('Access token is missing from this link. Please use the complete reservation URL provided when you reserved the gift.')
          setLoading(false)
        }
        return
      }

      if (!ignore) {
        setToken(resolvedToken)
      }

      try {
        const { data, error: rpcError } = await supabase.rpc('get_shared_address', {
          p_reservation_id: reservationId,
          p_access_token: resolvedToken,
        })

        if (!ignore) {
          if (rpcError) {
            setError(rpcError)
            return
          }
          if (data && data.length > 0) {
            setAddress({
              label: data[0].address_label,
              full_address: data[0].full_address,
            })
          } else {
            setAddress(null)
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(err)
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadData()
    return () => {
      ignore = true
    }
  }, [reservationId, searchParams, supabase])

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
    <>
      <main className="min-h-screen bg-cotton py-8 sm:py-12 px-4 flex justify-center items-start selection:bg-blush/50 selection:text-ink">
        <div className="max-w-lg w-full space-y-6">

          {/* Top Bar */}
          <div className="flex items-center justify-between px-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-muted hover:text-ink transition-colors px-3 py-2 rounded-xl hover:bg-parchment-light/60 min-h-[40px]"
            >
              <Home className="w-3.5 h-3.5 text-caramel" />
              <span>Wishlink</span>
            </Link>

            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-spruce bg-spruce-light px-3 py-1.5 rounded-full border border-spruce/30">
              <ShieldCheck className="w-3.5 h-3.5 text-spruce" />
              Private Token Ticket
            </span>
          </div>

          {/* Delivery Card */}
          <div className="paper-tag rounded-3xl p-6 sm:p-8 space-y-6 bg-white border border-parchment md-elevation-1">

            <div>
              <span className="text-[11px] font-mono text-caramel uppercase tracking-wider block mb-1">
                Reservation #{reservationId.slice(0, 8)}
              </span>
              <h1 className="text-2xl font-serif font-bold text-ink tracking-tight">
                Gift Delivery Details
              </h1>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-muted">
                <RefreshCw className="w-6 h-6 animate-spin text-caramel stroke-1" />
                <p className="text-xs">Checking address status...</p>
              </div>
            ) : error ? (
              <MaterialErrorBanner
                error={error}
                onDismiss={() => setError(null)}
                onRetry={() => token && fetchAddress(token)}
                fallbackMessage="Failed to load reservation details. The ticket link may be invalid or expired."
              />
            ) : address ? (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Address Unlocked Banner */}
                <div className="p-4 rounded-2xl bg-spruce-light border border-spruce/30 text-spruce space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Shipping Address Approved</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">
                    The recipient shared this delivery address for your reserved gift. You can now purchase the item from the merchant and ship it here.
                  </p>
                </div>

                {/* Address Display Box */}
                <div className="p-5 rounded-2xl bg-parchment-light/40 border border-parchment space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-caramel" />
                      <span className="text-xs font-serif font-bold text-ink">
                        {address.label || 'Destination Address'}
                      </span>
                    </div>

                    <button
                      onClick={handleCopyAddress}
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-caramel hover:text-mocha cursor-pointer py-1"
                    >
                      {copiedAddress ? <Check className="w-3.5 h-3.5 text-spruce" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedAddress ? 'Copied' : 'Copy address'}</span>
                    </button>
                  </div>

                  <p className="text-sm text-ink whitespace-pre-wrap font-sans leading-relaxed pt-1 font-medium">
                    {address.full_address}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-parchment-light/60 border border-parchment text-slate-muted text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 text-caramel shrink-0" />
                  <span>Bookmark this URL. The recipient&apos;s address is only visible through your secure token.</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-parchment-light rounded-2xl flex items-center justify-center mx-auto text-caramel border border-parchment">
                  <Clock className="w-7 h-7 stroke-1" />
                </div>

                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h3 className="text-base font-serif font-bold text-ink">
                    Awaiting Recipient Address
                  </h3>
                  <p className="text-xs text-slate-muted leading-relaxed">
                    The recipient received a notification of your gift reservation. As soon as they select their preferred shipping destination, it will appear here.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => token && fetchAddress(token)}
                    type="button"
                    className="posh-button-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer min-h-[44px]"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Check Again</span>
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      </main>
    </>
  )
}
