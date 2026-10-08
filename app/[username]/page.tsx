import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import ShareProfileButton from '@/components/ShareProfileButton'
import { cache } from 'react'

type Props = {
  params: Promise<{ username: string }>
}

// ১. Deduplication-এর জন্য Cached Function তৈরি
// React-এর cache() নিশ্চিত করবে যে এক রিকোয়েস্টে এই ফাংশনটি যতবারই কল হোক না কেন,
// ডাটাবেসে কুয়েরি যাবে মাত্র একবার।
const getProfile = cache(async (username: string) => {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', username.replace(/[\\%_]/g, '\\$&'))
    .single()

  return profile
})

// ২. Dynamic Metadata Generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params

  // এখানে প্রথমবার getProfile কল হবে এবং ডাটাবেস থেকে ডেটা আসবে
  const profile = await getProfile(username)

  if (!profile) {
    return {
      title: 'Profile Not Found',
      description: 'The requested wishlist profile could not be found.',
    }
  }

  const petName = profile.pet_name || username
  const fallbackImage = 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=800&auto=format&fit=crop'

  return {
    title: `${petName}'s Wishlist`,
    description: `Check out what ${petName} is wishing for!`,
    openGraph: {
      title: `${petName}'s Wishlist`,
      description: `Check out what ${petName} is wishing for!`,
      images: [profile.avatar_url || fallbackImage],
    },
  }
}

// ৩. Main Server Component
export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params

  // এখানে দ্বিতীয়বার getProfile কল হচ্ছে, কিন্তু ডাটাবেসে নতুন করে কুয়েরি যাবে না।
  // এটি সরাসরি React-এর মেমোরি ক্যাশ থেকে আগের ডেটা রিটার্ন করবে।
  const profile = await getProfile(username)

  if (!profile) {
    notFound()
  }

  const supabase = await createClient()
  // উইশলিস্ট আইটেম ফেচ করা ('gifted' হাইড করা থাকবে)
  const { data: items } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('user_id', profile.id)
    .in('status', ['available', 'reserved'])
    .order('sort_order', { ascending: true })

  const petName = profile.pet_name || profile.username

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-md mx-auto w-full">

        {/* Profile Header */}
        <header className="bg-white px-6 pt-12 pb-8 rounded-b-3xl shadow-sm flex flex-col items-center text-center mb-6">
          <div className="w-24 h-24 mb-4 rounded-full overflow-hidden bg-gray-100 ring-4 ring-gray-50">
            <img
              src={profile.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${profile.username}`}
              alt={petName}
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{petName}</h1>
          <p className="text-gray-500 mb-4">@{profile.username}</p>

          <ShareProfileButton profileId={profile.id} username={profile.username} />
        </header>

        {/* Wishlist Items */}
        <div className="px-4 flex flex-col gap-5">
          <h2 className="font-semibold text-gray-700 px-2">
            Wishlist ({items?.length || 0})
          </h2>

          {items && items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="aspect-square bg-gray-50 relative">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                  {item.category && (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                      {item.category}
                    </div>
                  )}
                </div>

                <div className="p-5 flex flex-col gap-2">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 leading-tight">
                    {item.title || 'Untitled Item'}
                  </h3>
                  {item.price && <span className="font-medium text-gray-600">{item.price}</span>}

                  <div className="mt-3">
                    {item.status === 'available' ? (
                      <Link
                        href={`/${profile.username}/gift/${item.id}`}
                        className="block w-full bg-black text-white text-center py-3.5 rounded-xl font-semibold hover:bg-gray-800 transition-colors active:scale-[0.98]"
                      >
                        🎁 Gift this
                      </Link>
                    ) : (
                      <div className="w-full bg-amber-50 text-amber-700 border border-amber-200 text-center py-3.5 rounded-xl font-semibold">
                        Already being gifted 🎉
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-10">No items available right now.</p>
          )}
        </div>
      </div>
    </main>
  )
}
