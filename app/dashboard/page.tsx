import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AddWishlistItemForm from '@/components/AddWishlistItemForm'
import SortableWishlist from '@/components/SortableWishlist'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // sort_order অনুযায়ী উইশলিস্ট আইটেম ফেচ করা
  const { data: items } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
        <p className="text-gray-500 mt-1">Add products, edit details, and rearrange your wishlist.</p>
      </div>

      {/* Add New Item Form */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <AddWishlistItemForm userId={user.id} />
      </section>

      {/* Draggable Wishlist Items List */}
      <section>
        {items && items.length > 0 ? (
          <SortableWishlist items={items} />
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-10 text-center">
            <p className="text-gray-500 font-medium">আপনার উইশলিস্টে এখনো কোনো আইটেম নেই।</p>
            <p className="text-sm text-gray-400 mt-1">উপরের ফর্মে কোনো প্রোডাক্টের লিংক পেস্ট করে শুরু করুন।</p>
          </div>
        )}
      </section>

    </div>
  )
}
