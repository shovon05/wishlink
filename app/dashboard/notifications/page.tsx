'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, X } from 'lucide-react'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [addresses, setAddresses] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  // Modal states
  const [shareModalResId, setShareModalResId] = useState<string | null>(null)
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')

  const supabase = createClient()

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Fetch Addresses for modal
      const { data: addrs } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('priority', { ascending: true })
      if (addrs) {
        setAddresses(addrs)
        if (addrs.length > 0) setSelectedAddressId(addrs[0].id)
      }

      // Fetch Notifications + Joins
      const { data: notifs } = await supabase
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

      if (notifs) setNotifications(notifs)

      // Mark all as read
      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null)
    }

    initData()
  }, [supabase])

  useEffect(() => {
    if (!userId) return

    const channel = supabase.channel('realtime_notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, async (payload) => {
        // Fetch full data for the new notification
        const { data } = await supabase
          .from('notifications')
          .select(`*, gift_reservations(*, wishlist_items(*))`)
          .eq('id', payload.new.id)
          .single()

        if (data) {
          // Mark this new one as read immediately since we are on the page
          await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', data.id)
          data.isNew = true // UI badge purpose
          setNotifications(prev => [data, ...prev])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase])

  const handleShareAddress = async () => {
    if (!shareModalResId || !selectedAddressId) return
    await supabase.from('gift_reservations').update({ shared_address_id: selectedAddressId }).eq('id', shareModalResId)

    // Update local state
    setNotifications(prev => prev.map(n =>
      n.reservation_id === shareModalResId
        ? { ...n, gift_reservations: { ...n.gift_reservations, shared_address_id: selectedAddressId } }
        : n
    ))
    setShareModalResId(null)
  }

  const handleRpcAction = async (rpcName: 'complete_gift_reservation' | 'cancel_gift_reservation', reservationId: string, newStatus: string) => {
    if (confirm(`Are you sure you want to ${newStatus === 'completed' ? 'complete' : 'cancel'} this gift?`)) {
      await supabase.rpc(rpcName, { p_reservation_id: reservationId })
      setNotifications(prev => prev.map(n =>
        n.reservation_id === reservationId
          ? { ...n, gift_reservations: { ...n.gift_reservations, status: newStatus } }
          : n
      ))
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 relative">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Notifications</h1>

      {notifications.length === 0 ? (
        <p className="text-gray-500">You have no notifications yet.</p>
      ) : (
        <div className="space-y-4">
          {notifications.map(n => {
            const res = n.gift_reservations
            const item = res?.wishlist_items
            const isUnread = !n.read_at || n.isNew

            return (
              <div key={n.id} className={`p-5 rounded-2xl border transition-all ${isUnread ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 shadow-sm'}`}>
                <div className="flex items-start gap-4">
                  {/* Item Image */}
                  <img src={item?.image_url || '/placeholder.png'} alt={item?.title} className="w-16 h-16 rounded-xl object-cover bg-gray-100 shrink-0" />

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-gray-900">
                        {n.isNew && <span className="bg-red-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mr-2">New!</span>}
                        {res?.is_anonymous ? 'Someone' : res?.gifter_contact} wants to gift this!
                      </p>
                      <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>

                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">"{item?.title}"</p>

                    {/* Actions */}
                    {res?.status === 'active' && (
                      <div className="mt-4">
                        {!res.shared_address_id ? (
                          <button
                            onClick={() => setShareModalResId(res.id)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                          >
                            Share an address
                          </button>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <span className="text-green-600 text-sm font-semibold flex items-center gap-1">
                              <Check size={16} /> Address shared
                            </span>
                            <div className="flex gap-2">
                              <button onClick={() => handleRpcAction('complete_gift_reservation', res.id, 'completed')} className="bg-gray-900 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-gray-800">
                                Mark as completed
                              </button>
                              <button onClick={() => handleRpcAction('cancel_gift_reservation', res.id, 'cancelled')} className="bg-red-50 text-red-600 px-3 py-1.5 rounded text-xs font-medium hover:bg-red-100 flex items-center gap-1">
                                <X size={14} /> Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {res?.status === 'completed' && <span className="inline-block mt-3 text-sm font-bold text-gray-400">Gift Completed</span>}
                    {res?.status === 'cancelled' && <span className="inline-block mt-3 text-sm font-bold text-red-400">Reservation Cancelled</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Share Address Modal */}
      {shareModalResId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold mb-4">Where should they send it?</h3>
            {addresses.length === 0 ? (
              <p className="text-red-500 text-sm mb-4">You don't have any addresses yet. Please add one in the Addresses tab.</p>
            ) : (
              <select value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)} className="w-full px-4 py-3 border rounded-xl mb-6 bg-gray-50">
                {addresses.map(a => (
                  <option key={a.id} value={a.id}>{a.label} - {a.full_address.substring(0, 30)}...</option>
                ))}
              </select>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setShareModalResId(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
              <button onClick={handleShareAddress} disabled={addresses.length === 0} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                Confirm & Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
