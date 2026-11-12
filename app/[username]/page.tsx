import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import ShareProfileButton from '@/components/ShareProfileButton'
import { cache } from 'react'
import { ShieldCheck, Gift, CheckCircle2, PackageOpen } from 'lucide-react'

type Props = {
  params: Promise<{ username: string }>
}

const getProfile = cache(async (username: string) => {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', username.replace(/[\\%_]/g, '\\$&'))
    .maybeSingle()

  return profile
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const profile = await getProfile(username)

  if (!profile) {
    return {
      title: 'Registry Not Found',
      description: 'The requested wishlist profile could not be found.',
    }
  }

  const petName = profile.pet_name || profile.username
  const fallbackImage = 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=800&auto=format&fit=crop'

  return {
    title: `${petName}'s Wishlist — Wishlink`,
    description: `Browse ${petName}'s registry and reserve a gift safely without awkward address questions.`,
    openGraph: {
      title: `${petName}'s Wishlist on Wishlink`,
      description: `Browse ${petName}'s registry and reserve a gift safely.`,
      images: [profile.avatar_url || fallbackImage],
    },
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params
  const profile = await getProfile(username)

  if (!profile) {
    notFound()
  }

  const supabase = await createClient()
  const { data: items } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('user_id', profile.id)
    .in('status', ['available', 'reserved'])
    .order('sort_order', { ascending: true })

  const petName = profile.pet_name || profile.username
  const avatarUrl = profile.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${profile.username}`
  const availableCount = items?.filter((i) => i.status === 'available').length || 0

  return (
    <main className="min-h-screen bg-cotton pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16">

        {/* Profile Registry Header */}
        <header className="paper-tag rounded-3xl p-6 sm:p-8 mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-parchment-light border border-parchment shrink-0 shadow-xs">
            <Image
              src={avatarUrl}
              alt={petName}
              width={112}
              height={112}
              className="w-full h-full object-cover"
              unoptimized={avatarUrl.endsWith('.svg')}
            />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink tracking-tight">
                  {petName}
                </h1>
                <p className="text-sm text-slate-muted mt-0.5">@{profile.username}</p>
              </div>

              <div className="flex items-center justify-center sm:justify-end gap-2">
                <ShareProfileButton username={profile.username} petName={petName} />
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-muted">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-parchment-light border border-parchment text-ink font-medium">
                <Gift className="w-3.5 h-3.5 text-ribbon" />
                {availableCount} {availableCount === 1 ? 'item available' : 'items available'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-spruce-light/60 border border-spruce/20 text-spruce font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-spruce" />
                Zero-leak delivery address privacy
              </span>
            </div>
          </div>
        </header>

        {/* Registry Items Grid */}
        <section aria-labelledby="registry-heading">
          <div className="flex items-center justify-between mb-5 px-1">
            <h2 id="registry-heading" className="text-lg font-serif font-bold text-ink">
              Wishlist Catalog
            </h2>
            <span className="text-xs text-slate-muted">
              {items?.length || 0} {items?.length === 1 ? 'total item' : 'total items'}
            </span>
          </div>

          {items && items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((item) => {
                const isAvailable = item.status === 'available'

                return (
                  <article
                    key={item.id}
                    className="paper-tag rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-150 hover:shadow-md"
                  >
                    <div>
                      {/* Product Image */}
                      <div className="aspect-square bg-parchment-light relative overflow-hidden border-b border-parchment">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.title || 'Product'}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-300 hover:scale-102"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-muted gap-2">
                            <PackageOpen className="w-8 h-8 stroke-1 text-slate-muted/60" />
                            <span className="text-xs">No image provided</span>
                          </div>
                        )}

                        {item.category && (
                          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[11px] font-medium text-ink border border-parchment shadow-2xs">
                            {item.category}
                          </div>
                        )}

                        {!isAvailable && (
                          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[11px] font-medium text-spruce border border-spruce/20 shadow-2xs flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-spruce" />
                            Reserved
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="p-4 sm:p-5">
                        <h3 className="font-semibold text-base text-ink line-clamp-2 leading-snug mb-1">
                          {item.title || 'Untitled Wishlist Item'}
                        </h3>
                        {item.price_amount ? (
                          <p className="text-sm font-semibold text-slate-muted tabular-nums">
                            {item.price_currency === 'USD' || !item.price_currency ? '$' : `${item.price_currency} `}
                            {Number(item.price_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        ) : item.price ? (
                          <p className="text-sm font-medium text-slate-muted tabular-nums">
                            {item.price}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-muted/70 italic">Price not listed</p>
                        )}
                      </div>
                    </div>

                    {/* Action Area */}
                    <div className="p-4 sm:p-5 pt-0">
                      {isAvailable ? (
                        <Link
                          href={`/${profile.username}/gift/${item.id}`}
                          className="w-full flex items-center justify-center gap-2 bg-ribbon text-white hover:bg-ribbon-hover active:scale-98 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-150 shadow-xs cursor-pointer"
                        >
                          <Gift className="w-4 h-4 stroke-[2.2]" />
                          <span>Reserve gift</span>
                        </Link>
                      ) : (
                        <div className="w-full text-center py-2.5 px-4 rounded-xl text-xs font-medium bg-spruce-light text-spruce border border-spruce/20 flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>A gifter has reserved this</span>
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="paper-tag rounded-3xl p-12 text-center max-w-md mx-auto my-8 space-y-3">
              <PackageOpen className="w-10 h-10 text-slate-muted mx-auto stroke-1" />
              <h3 className="text-lg font-serif font-semibold text-ink">No items listed yet</h3>
              <p className="text-sm text-slate-muted">
                {petName} hasn&apos;t added any items to this registry yet. Check back soon!
              </p>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-16 text-center text-xs text-slate-muted/70 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 border-t border-parchment pt-8">
          <span>Wishlink Registry</span>
          <span className="hidden sm:inline">·</span>
          <span>Privacy-first gift coordination</span>
          <span className="hidden sm:inline">·</span>
          <Link href="/" className="text-ink hover:underline">
            Create your own wishlist
          </Link>
        </footer>

      </div>
    </main>
  )
}
