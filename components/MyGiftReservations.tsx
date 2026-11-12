'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, ExternalLink } from 'lucide-react'

interface Reservation {
  reservation_id: string
  access_token: string
  item_title: string
  reserved_at: string
}

export default function MyGiftReservations() {
  const [isOpen, setIsOpen] = useState(false)
  const [reservations, setReservations] = useState<Reservation[]>([])

  useEffect(() => {
    const handleStorage = () => {
      try {
        const data = localStorage.getItem('gift_reservations')
        if (data) {
          const parsed = JSON.parse(data)
          if (Array.isArray(parsed)) {
            setReservations(parsed)
          }
        }
      } catch {
        // Ignore localStorage access failures in restricted environments
      }
    }

    handleStorage()
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  if (reservations.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink bg-parchment-light border border-parchment hover:border-slate-muted/40 transition-colors cursor-pointer"
      >
        <Package className="w-3.5 h-3.5 text-ribbon" />
        <span>Outgoing Gifts</span>
        <span className="w-4 h-4 rounded-full bg-ink text-white text-[10px] flex items-center justify-center font-bold">
          {reservations.length}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white border border-parchment rounded-xl shadow-lg z-50 p-2 space-y-1">
            <div className="px-3 py-2 border-b border-parchment flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">Gifts You Reserved</span>
              <span className="text-[10px] text-slate-muted">Saved locally</span>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1 p-1">
              {reservations.map((res) => (
                <Link
                  key={res.reservation_id}
                  href={`/reservations/${res.reservation_id}#token=${res.access_token}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-2.5 hover:bg-parchment-light rounded-lg transition-colors group"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-medium text-ink truncate group-hover:text-ribbon transition-colors">
                      {res.item_title}
                    </p>
                    <p className="text-[10px] text-slate-muted mt-0.5">
                      Reserved {new Date(res.reserved_at).toLocaleDateString()}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-muted group-hover:text-ink shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
