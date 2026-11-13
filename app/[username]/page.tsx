import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Image from 'next/image'
import ShareProfileButton from '@/components/ShareProfileButton'
import { cache } from 'react'
import { ShieldCheck, Gift, CheckCircle2, PackageOpen, Sparkles, User } from 'lucide-react'

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
    description: `Browse ${petName}'s private registry and reserve a gift safely without awkward address questions.`,
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
  const avatarUrl = profile.avatar_url
  const availableCount = items?.filter((i) => i.status === 'available').length || 0

  return (
    <main className="min-h-screen bg-cotton pb-20 selection:bg-blush/50 selection:text-ink">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-16">

        {/* Profile Registry Header */}
        <header className="paper-tag rounded-3xl p-6 sm:p-8 mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden bg-white border border-parchment md-elevation-1">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-parchment-light border border-parchment shrink-0 shadow-xs flex items-center justify-center">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={petName}
                width={112}
                height={112}
                className="w-full h-full object-cover"
                unoptimized
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-parchment-light to-parchment text-mocha/60">
                <User className="w-10 h-10 stroke-[1.8]" />
              </div>
            )}
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

            <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-slate-muted flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-parchment-light/80 text-mocha font-semibold border border-parchment">
                <Gift className="w-3.5 h-3.5 text-caramel stroke-[2]" />
                <span>{availableCount} {availableCount === 1 ? 'wish' : 'wishes'} available</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-spruce-light text-spruce font-semibold border border-spruce/20">
                <ShieldCheck className="w-3.5 h-3.5 stroke-[2]" />
                <span>Zero-leak delivery address privacy</span>
              </span>
            </div>
          </div>
        </header>

        {/* Wishlist Items Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-serif font-bold text-ink flex items-center gap-2">
              <span>Wishlist Catalog</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-parchment-light text-mocha border border-parchment">
                <Sparkles className="w-3 h-3 inline mr-1 text-caramel" />
                Curated
              </span>
            </h2>
            <span className="text-xs text-slate-muted font-mono">
              {items?.length || 0} total {items?.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {!items || items.length === 0 ? (
            <div className="paper-tag rounded-3xl p-12 text-center bg-white border border-parchment md-elevation-1 space-y-3">
              <PackageOpen className="w-12 h-12 mx-auto text-caramel/60 stroke-[1.5]" />
              <h3 className="text-base font-serif font-bold text-ink">
                No wishes published yet
              </h3>
              <p className="text-xs text-slate-muted max-w-sm mx-auto leading-relaxed">
                {petName} hasn&apos;t added any gifts to this registry yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((item) => {
                const isReserved = item.status === 'reserved'
                return (
                  <div
                    key={item.id}
                    className={`paper-tag rounded-3xl overflow-hidden flex flex-col bg-white border border-parchment md-elevation-1 transition-all ${
                      isReserved
                        ? 'opacity-70 grayscale-[30%] border-dashed'
                        : 'hover:border-caramel/40 hover:md-elevation-2'
                    }`}
                  >
                    {/* Item Image */}
                    <div className="relative aspect-square w-full bg-parchment-light overflow-hidden">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.title || 'Gift item'}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-muted gap-2 text-xs">
                          <PackageOpen className="w-10 h-10 text-caramel/40 stroke-[1.2]" />
                          <span>No product photo</span>
                        </div>
                      )}

                      {/* Status Badges */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        {item.category && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/95 text-ink shadow-xs backdrop-blur-xs border border-parchment/60">
                            {item.category}
                          </span>
                        )}
                        {isReserved && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-mocha text-cotton shadow-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Claimed</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Item Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <h3 className="font-serif font-bold text-sm text-ink line-clamp-2 leading-snug">
                          {item.title}
                        </h3>

                        {item.price ? (
                          <p className="text-xs font-mono font-semibold text-caramel">
                            {item.price}
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-muted italic">
                            Price not listed
                          </p>
                        )}
                      </div>

                      {/* Gifter Action */}
                      <div>
                        {isReserved ? (
                          <button
                            disabled
                            type="button"
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-parchment-light text-slate-muted cursor-not-allowed text-center"
                          >
                            Claimed by another gifter
                          </button>
                        ) : (
                          <a
                            href={`/${profile.username}/gift/${item.id}`}
                            className="posh-button-primary w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer text-center block"
                          >
                            <Gift className="w-3.5 h-3.5 text-blush" />
                            <span>Reserve Gift</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
