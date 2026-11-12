import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AddWishlistItemForm from '@/components/AddWishlistItemForm'
import SortableWishlist from '@/components/SortableWishlist'
import SurpriseModeToggle from '@/components/SurpriseModeToggle'
import { ExternalLink, PackageOpen } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, pet_name, surprise_mode')
    .eq('id', user.id)
    .maybeSingle()

  const { data: items } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })

  const totalCount = items?.length || 0
  const isSurprise = Boolean(profile?.surprise_mode)
  const reservedCount = items?.filter(i => i.status === 'reserved' || i.status === 'gifted').length || 0

  return (
    <div className="space-y-8">

      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink tracking-tight">
            My Wishlist
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
            {totalCount} {totalCount === 1 ? 'item' : 'items'} in your registry
            {isSurprise ? (
              <span className="text-spruce font-medium"> · Spoiler-Free Mode active</span>
            ) : (
              reservedCount > 0 && ` · ${reservedCount} being gifted`
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SurpriseModeToggle userId={user.id} initialSurpriseMode={isSurprise} />

          {profile?.username && (
            <Link
              href={`/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-parchment text-ink hover:bg-parchment-light transition-all shadow-2xs"
            >
              <span>Preview Public View</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-muted" />
            </Link>
          )}
        </div>
      </div>

      {/* Add New Item Form Shell */}
      <section className="paper-tag rounded-3xl p-6 sm:p-7">
        <AddWishlistItemForm userId={user.id} />
      </section>

      {/* Sortable Wishlist Items Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-ink">
            Organize & Prioritize
          </h2>
          <span className="text-xs text-slate-muted">
            Drag items to set their order
          </span>
        </div>

        {items && items.length > 0 ? (
          <SortableWishlist items={items} surpriseMode={isSurprise} />
        ) : (
          <div className="paper-tag rounded-3xl p-10 sm:p-14 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-parchment-light border border-parchment flex items-center justify-center mx-auto text-slate-muted">
              <PackageOpen className="w-6 h-6 stroke-1" />
            </div>
            <h3 className="text-base font-semibold text-ink">Your registry is empty</h3>
            <p className="text-xs text-slate-muted max-w-sm mx-auto leading-relaxed">
              Paste a product link in the form above to add your first wish. We&apos;ll pull in photos, titles, and pricing automatically.
            </p>
          </div>
        )}
      </section>

    </div>
  )
}
