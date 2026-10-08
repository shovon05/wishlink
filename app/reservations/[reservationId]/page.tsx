'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

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

  const fetchAddress = async () => {
    if (!token) {
      setError('Access token is missing in the URL.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: rpcError } = await supabase.rpc('get_shared_address', {
        p_reservation_id: reservationId,
        p_access_token: token
      })

      if (rpcError) throw new Error(rpcError.message)

      // যদি অ্যাড্রেস না থাকে, RPC খালি অ্যারে রিটার্ন করবে
      if (data && data.length > 0) {
        setAddress({
          label: data[0].address_label,
          full_address: data[0].full_address
        })
      } else {
        setAddress(null)
      }
    } catch (err: any) {
      setError('Failed to load reservation details. The link might be invalid or expired.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAddress()
  }, [reservationId, token])

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 flex justify-center items-start">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Gift Delivery</h1>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">Home</Link>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-gray-400">Loading details...</div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-200">
            {error}
          </div>
        ) : address ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl">
              <h3 className="font-semibold mb-1">Address Shared!</h3>
              <p className="text-sm">You can now purchase and ship the gift to this address.</p>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              {address.label && (
                <span className="text-xs font-bold uppercase text-gray-500 mb-1 block">
                  {address.label}
                </span>
              )}
              <p className="text-gray-900 whitespace-pre-wrap">{address.full_address}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ⏳
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Waiting for address</h3>
            <p className="text-sm text-gray-500 mb-6">
              Waiting for them to share a delivery address. Check back soon!
            </p>
            <button
              onClick={fetchAddress}
              className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
            >
              Refresh Status
            </button>
          </div>
        )}

      </div>
    </main>
  )
}
