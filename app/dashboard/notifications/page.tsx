'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { Bell, MapPin, CheckCircle2, PackageOpen, Gift, EyeOff } from 'lucide-react'
import MaterialErrorBanner from '@/components/MaterialErrorBanner'

interface AddressItem {
  id: string
  label: string | null
  full_address: string
  priority: number
}

interface NotificationRecord {
  id: string
  user_id: string
  reservation_id: string
  created_at: string
  read_at: string | null
  isNew?: boolean
  gift_reservations?: {
    id: string
    is_anonymous: boolean
    gifter_contact: string | null
    status: string
    shared_address_id: string | null
    wishlist_items?: {
      id: string
      title: string | null
      image_url: string | null
      price: string | null
    }
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [addresses, setAddresses] = useState<AddressItem[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [surpriseMode, setSurpriseMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState<unknown | null>(null)

  // Modal states
  const [shareModalResId, setShareModalResId] = useState<string | null>(null)
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')

  const supabase = createClient()

  useEffect(() => {
    const initData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return
        setUserId(user.id)

        const { data: profile } = await supabase
          .from('profiles')
          .select('surprise_mode')
          .eq('id', user.id)
          .maybeSingle()

        if (profile) {
          setSurpriseMode(Boolean(profile.surprise_mode))
        }

        const { data: addrs, error: addrError } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('priority', { ascending: true })

        if (addrError) {
          setActionError(addrError)
        } else if (addrs) {
          setAddresses(addrs)
          if (addrs.length > 0) setSelectedAddressId(addrs[0].id)
        }

        const { data: notifs, error: notifError } = await supabase
          .from('notifications')
          .select(`
            *,
            gift_reservations (
              *,
              wishlist_items (*)
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (notifError) {
          setActionError(notifError)
        } else if (notifs) {
          setNotifications(notifs as unknown as NotificationRecord[])
        }

        setLoading(false)

        await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .is('read_at', null)
      } catch (err) {
        setActionError(err)
        setLoading(false)
      }
    }

    initData()
  }, [supabase])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('realtime_notifs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        async (payload) => {
          const { data } = await supabase
            .from('notifications')
            .select(`*, gift_reservations(*, wishlist_items(*))`)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            await supabase
              .from('notifications')
              .update({ read_at: new Date().toISOString() })
              .eq('id', data.id)

            const formatted = { ...data, isNew: true } as unknown as NotificationRecord
            setNotifications((prev) => [formatted, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  // Consent Protocol: Atomic Server-Side Approval (WL-PRIV-002)
  const handleApproveDisclosure = async () => {
    if (!shareModalResId || !selectedAddressId) return
    setActionError(null)

    try {
      const { error: approveError } = await supabase.rpc('approve_gift_disclosure', {
        p_reservation_id: shareModalResId,
        p_address_id: selectedAddressId,
      })

      if (approveError) {
        setActionError(approveError)
        return
      }

      setNotifications((prev) =>
        prev.map((n) =>
          n.reservation_id === shareModalResId
            ? {
                ...n,
                gift_reservations: n.gift_reservations
                  ? { ...n.gift_reservations, shared_address_id: selectedAddressId }
                  : undefined,
              }
            : n
        )
      )
      setShareModalResId(null)
    } catch (err) {
      setActionError(err)
    }
  }

  // Revoke Address Disclosure (WL-PRIV-002)
  const handleRevokeDisclosure = async (reservationId: string) => {
    if (confirm('Revoke access to your delivery address? The gifter will no longer be able to view your destination.')) {
      setActionError(null)
      try {
        const { error: revokeError } = await supabase.rpc('revoke_gift_disclosure', {
          p_reservation_id: reservationId,
        })

        if (revokeError) {
          setActionError(revokeError)
          return
        }

        setNotifications((prev) =>
          prev.map((n) =>
            n.reservation_id === reservationId
              ? {
                  ...n,
                  gift_reservations: n.gift_reservations
                    ? { ...n.gift_reservations, shared_address_id: null }
                    : undefined,
                }
              : n
          )
        )
      } catch (err) {
        setActionError(err)
      }
    }
  }

  // Decline Request (WL-PRIV-002)
  const handleDeclineRequest = async (reservationId: string) => {
    if (confirm('Decline this gift request? The item will be made available again on your public wishlist.')) {
      setActionError(null)
      try {
        const { error: declineError } = await supabase.rpc('decline_gift_reservation', {
          p_reservation_id: reservationId,
        })

        if (declineError) {
          setActionError(declineError)
          return
        }

        setNotifications((prev) =>
          prev.map((n) =>
            n.reservation_id === reservationId
              ? {
                  ...n,
                  gift_reservations: n.gift_reservations
                    ? { ...n.gift_reservations, status: 'cancelled' }
                    : undefined,
                }
              : n
          )
        )
      } catch (err) {
        setActionError(err)
      }
    }
  }

  const handleRpcAction = async (
    rpcName: 'complete_gift_reservation' | 'cancel_gift_reservation',
    reservationId: string,
    newStatus: string
  ) => {
    if (confirm(`Are you sure you want to mark this gift as ${newStatus === 'completed' ? 'completed' : 'cancelled'}?`)) {
      setActionError(null)
      try {
        const { error: rpcError } = await supabase.rpc(rpcName, { p_reservation_id: reservationId })
        if (rpcError) {
          setActionError(rpcError)
          return
        }

        setNotifications((prev) =>
          prev.map((n) =>
            n.reservation_id === reservationId
              ? {
                  ...n,
                  gift_reservations: n.gift_reservations
                    ? { ...n.gift_reservations, status: newStatus }
                    : undefined,
                }
              : n
          )
        )
      } catch (err) {
        setActionError(err)
      }
    }
  }

  return (
    <div className="space-y-6 relative max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink tracking-tight">
          Gifting Requests & Activity
        </h1>
        <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
          Review incoming gift requests and decide which delivery address to approve for each gifter.
        </p>
      </div>

      {Boolean(actionError) && (
        <MaterialErrorBanner
          error={actionError}
          onDismiss={() => setActionError(null)}
          fallbackMessage="Unable to process gifting request on the database."
        />
      )}

      {loading ? (
        <div className="paper-tag rounded-3xl p-12 text-center text-slate-muted text-xs bg-white border border-parchment md-elevation-1">
          Loading requests...
        </div>
      ) : notifications.length === 0 ? (
        <div className="paper-tag rounded-3xl p-12 text-center space-y-3 bg-white border border-parchment md-elevation-1">
          <div className="w-12 h-12 rounded-2xl bg-parchment-light border border-parchment flex items-center justify-center mx-auto text-caramel">
            <Bell className="w-6 h-6 stroke-1" />
          </div>
          <h3 className="text-base font-serif font-bold text-ink">No gift activity yet</h3>
          <p className="text-xs text-slate-muted max-w-sm mx-auto leading-relaxed">
            When someone reserves an item from your public wishlist, you will be notified here to review their request and approve a delivery destination.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => {
            const res = n.gift_reservations
            const item = res?.wishlist_items
            const isUnread = !n.read_at || n.isNew

            return (
              <div
                key={n.id}
                className={`paper-tag rounded-2xl p-4 sm:p-5 transition-all bg-white border border-parchment md-elevation-1 ${
                  isUnread ? 'ring-1 ring-caramel/50 bg-parchment-light/20' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Item Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden relative border border-parchment bg-parchment-light shrink-0">
                    {surpriseMode ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-blush/40 text-mocha p-1 text-center">
                        <Gift className="w-5 h-5 stroke-[1.8] text-ribbon" />
                        <span className="text-[9px] font-bold uppercase tracking-tight mt-0.5">Surprise</span>
                      </div>
                    ) : item?.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.title || 'Gift item'}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-muted">
                        <PackageOpen className="w-5 h-5 stroke-1" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        {n.isNew && (
                          <span className="bg-ribbon text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            New
                          </span>
                        )}
                        <p className="font-serif font-bold text-sm text-ink truncate">
                          {res?.is_anonymous ? 'Anonymous gifter' : res?.gifter_contact} requested to send this gift
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-muted font-mono">
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-muted mt-1 truncate">
                      {surpriseMode ? (
                        <span className="inline-flex items-center gap-1.5 text-caramel font-medium">
                          <EyeOff className="w-3.5 h-3.5 text-caramel shrink-0" />
                          <span>A gift on your wishlist (title protected by Surprise Mode)</span>
                        </span>
                      ) : (
                        <span>Item: &ldquo;{item?.title || 'Untitled item'}&rdquo;</span>
                      )}
                    </div>

                    {/* Actions */}
                    {res?.status === 'active' && (
                      <div className="mt-3.5 pt-3 border-t border-parchment flex flex-wrap items-center justify-between gap-3">
                        {!res.shared_address_id ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => setShareModalResId(res.id)}
                              type="button"
                              className="posh-button-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-xs min-h-[40px]"
                            >
                              <MapPin className="w-3.5 h-3.5 text-blush" />
                              <span>Approve and share</span>
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(res.id)}
                              type="button"
                              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-muted hover:text-error hover:bg-rose-50 border border-parchment transition-colors cursor-pointer min-h-[40px]"
                            >
                              Decline request
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                            <div className="flex items-center gap-2">
                              <span className="text-spruce text-xs font-semibold inline-flex items-center gap-1.5 bg-spruce-light px-3 py-1.5 rounded-full border border-spruce/30">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Address approved</span>
                              </span>
                              <button
                                onClick={() => handleRevokeDisclosure(res.id)}
                                type="button"
                                className="text-[11px] font-semibold text-slate-muted hover:text-error underline cursor-pointer py-1"
                              >
                                Revoke access
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleRpcAction('complete_gift_reservation', res.id, 'completed')}
                                type="button"
                                className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-parchment text-ink hover:bg-parchment-light transition-colors cursor-pointer min-h-[36px]"
                              >
                                Mark received
                              </button>
                              <button
                                onClick={() => handleRpcAction('cancel_gift_reservation', res.id, 'cancelled')}
                                type="button"
                                className="px-2.5 py-2 rounded-xl text-xs font-medium text-slate-muted hover:text-ribbon transition-colors cursor-pointer min-h-[36px]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {res?.status === 'completed' && (
                      <span className="inline-block mt-3 text-xs font-semibold text-mocha bg-parchment-light px-3 py-1 rounded-full border border-parchment">
                        Gift Received
                      </span>
                    )}

                    {res?.status === 'cancelled' && (
                      <span className="inline-block mt-3 text-xs font-medium text-ribbon bg-ribbon-light px-3 py-1 rounded-full border border-ribbon/30">
                        Request Declined / Cancelled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Share Address Modal with Plain-Language Consent (Section 4.5) */}
      {shareModalResId && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="paper-tag rounded-3xl p-6 sm:p-7 max-w-md w-full md-elevation-4 space-y-4 bg-white border border-parchment">
            <div>
              <h3 className="text-lg font-serif font-bold text-ink">
                Approve and Share Delivery Address
              </h3>
              <p className="text-xs text-slate-muted mt-1 leading-relaxed">
                Choose which saved destination to share with this gifter.
                Once approved, the gifter can view this address to ship your gift. You may revoke access at any time.
              </p>
            </div>

            {addresses.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-ribbon-light border border-ribbon/30 text-ribbon text-xs space-y-2">
                <p>You don&apos;t have any shipping addresses saved yet.</p>
                <Link
                  href="/dashboard/addresses"
                  className="font-semibold underline inline-block py-1"
                >
                  Add a delivery address first
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-muted block">
                  Select destination:
                </label>
                <select
                  value={selectedAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-parchment rounded-xl text-sm bg-white text-ink focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel cursor-pointer min-h-[44px]"
                >
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label || 'Home'} — {a.full_address.slice(0, 36)}...
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-parchment">
              <button
                onClick={() => setShareModalResId(null)}
                type="button"
                className="px-4 py-2.5 text-xs font-semibold text-slate-muted hover:text-ink transition-colors cursor-pointer min-h-[40px]"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveDisclosure}
                disabled={addresses.length === 0}
                type="button"
                className="posh-button-primary disabled:opacity-50 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer min-h-[40px]"
              >
                Approve and share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
