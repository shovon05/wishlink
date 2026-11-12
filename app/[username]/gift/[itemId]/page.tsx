import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import GiftReservationForm from '@/components/GiftReservationForm'
import { ExternalLink, ShieldCheck, ArrowLeft, PackageOpen } from 'lucide-react'

type Props = {
  params: Promise<{ username: string; itemId: string }>
}

export default async function GiftPage({ params }: Props) {
  const { username, itemId } = await params
  const supabase = await createClient()

  // Fetch item and owner profile
  const { data: item } = await supabase
    .from('wishlist_items')
    .select('*, profiles:user_id (username, pet_name)')
    .eq('id', itemId)
    .single()

  const petName = (item?.profiles as { username?: string; pet_name?: string } | null)?.pet_name || username

  // Unavailable item state
  if (!item || item.status !== 'available') {
    return (
      <main className="min-h-screen bg-cotton flex items-center justify-center p-4">
        <div className="max-w-md w-full paper-tag rounded-3xl p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-parchment-light rounded-2xl flex items-center justify-center mx-auto text-slate-muted border border-parchment">
            <PackageOpen className="w-7 h-7 stroke-1" />
          </div>
          <h1 className="text-xl font-serif font-bold text-ink">
            This item is no longer available
          </h1>
          <p className="text-sm text-slate-muted leading-relaxed">
            Another gifter may have just reserved this gift, or {petName} updated their registry.
          </p>
          <div className="pt-2">
            <Link
              href={`/${username}`}
              className="inline-flex items-center gap-2 bg-ink text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to {petName}&apos;s registry</span>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cotton py-10 sm:py-16 px-4">
      <div className="max-w-xl mx-auto w-full space-y-6">

        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <Link
            href={`/${username}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to {petName}&apos;s registry</span>
          </Link>

          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-spruce bg-spruce-light px-2.5 py-0.5 rounded-full border border-spruce/20">
            <ShieldCheck className="w-3 h-3 text-spruce" />
            Private & Encrypted
          </span>
        </div>

        {/* Item Summary Card */}
        <section className="paper-tag rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5">
          <div className="w-28 h-28 sm:w-32 sm:h-32 shrink-0 bg-parchment-light rounded-2xl overflow-hidden relative border border-parchment shadow-2xs">
            {item.image_url ? (
              <Image
                src={item.image_url}
                alt={item.title || 'Product'}
                fill
                sizes="128px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-muted text-xs">
                No image
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <span className="text-[11px] font-medium text-slate-muted uppercase tracking-wider block">
              Gifting to {petName}
            </span>
            <h2 className="text-lg font-semibold text-ink leading-snug">
              {item.title || 'Untitled Wishlist Item'}
            </h2>
            {item.price && (
              <p className="text-base font-semibold text-slate-muted tabular-nums">
                {item.price}
              </p>
            )}
            <a
              href={item.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-ribbon hover:text-ribbon-hover font-medium underline underline-offset-4"
            >
              <span>View product page on store</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </section>

        {/* Reservation Form */}
        <section className="paper-tag rounded-3xl p-6 sm:p-8">
          <GiftReservationForm
            itemId={item.id}
            itemTitle={item.title || 'Gift Item'}
            username={username}
            petName={petName}
          />
        </section>

      </div>
    </main>
  )
}
