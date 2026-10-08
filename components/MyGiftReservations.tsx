'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Reservation {
  reservation_id: string
  access_token: string
  item_title: string
  reserved_at: string
}

export default function MyGiftReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const data = localStorage.getItem('gift_reservations')
    if (data) {
      try {
        setReservations(JSON.parse(data))
      } catch (e) {
        console.error('Failed to parse reservations')
      }
    }
  }, [])

  if (!mounted || reservations.length === 0) return null

  return (
    <div className="relative group">
      {/* Trigger Button */}
      <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black">
        <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">
          {reservations.length}
        </span>
        My Reservations
      </button>

      {/* Dropdown Card */}
      <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 shadow-lg rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="p-3 border-b border-gray-50">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Gifts</h4>
        </div>
        <div className="max-h-64 overflow-y-auto p-2 space-y-1">
          {reservations.map((res) => (
            <Link
              key={res.reservation_id}
              href={`/reservations/${res.reservation_id}?token=${res.access_token}`}
              className="block p-3 hover:bg-gray-50 rounded-lg transition"
            >
              <p className="text-sm font-medium text-gray-900 truncate">
                {res.item_title}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(res.reserved_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
