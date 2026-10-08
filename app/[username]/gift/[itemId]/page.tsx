import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import GiftReservationForm from '@/components/GiftReservationForm'

type Props = {
  params: Promise<{ username: string; itemId: string }>
}

export default async function GiftPage({ params }: Props) {
  const { username, itemId } = await params
  const supabase = await createClient()

  // আইটেম ফেচ করা
  const { data: item } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('id', itemId)
    .single()

  // আইটেম না পেলে বা available না থাকলে
  if (!item || item.status !== 'available') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            😕
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            This item is no longer available for gifting
          </h1>
          <p className="text-gray-500 mb-6">
            It might have been reserved by someone else, or the owner removed it.
          </p>
          <Link
            href={`/${username}`}
            className="inline-block bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition"
          >
            Back to {username}'s Profile
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto w-full space-y-6">

        {/* Item Summary Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row items-center p-4 gap-6">
          <div className="w-32 h-32 shrink-0 bg-gray-50 rounded-xl overflow-hidden relative border border-gray-100">
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Image</div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 leading-tight mb-2">
              {item.title || 'Untitled Product'}
            </h2>
            {item.price && <p className="text-gray-600 font-medium">{item.price}</p>}
            <a
              href={item.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 text-sm hover:underline mt-2 inline-block"
            >
              View original product ↗
            </a>
          </div>
        </div>

        {/* Reservation Form Component */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <GiftReservationForm itemId={item.id} itemTitle={item.title} username={username} />
        </div>

      </div>
    </main>
  )
}
