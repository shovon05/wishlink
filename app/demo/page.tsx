'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck, Gift, CheckCircle2, ArrowRight, ExternalLink, X, Copy, Check } from 'lucide-react'

interface DemoItem {
  id: string
  title: string
  price: string
  currency: string
  category: string
  imageUrl: string
  productUrl: string
  status: 'available' | 'reserved'
}

const INITIAL_DEMO_ITEMS: DemoItem[] = [
  {
    id: 'demo-1',
    title: 'Matte Ceramic Pour-Over Kettle',
    price: '$74.00',
    currency: 'USD',
    category: 'Kitchenware',
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=800',
    productUrl: 'https://shop.ceramiclab.com/artisan-kettle',
    status: 'available',
  },
  {
    id: 'demo-2',
    title: 'Washed French Flax Linen Duvet Cover',
    price: '$185.00',
    currency: 'USD',
    category: 'Home & Bedding',
    imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800',
    productUrl: 'https://linencompany.com/french-flax-duvet',
    status: 'available',
  },
  {
    id: 'demo-3',
    title: 'Open-Back Studio Reference Headphones',
    price: '$199.00',
    currency: 'USD',
    category: 'Audio',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
    productUrl: 'https://soundcraft.fm/wireless-studio-phones',
    status: 'reserved',
  },
  {
    id: 'demo-4',
    title: 'Forged Japanese Santoku Kitchen Knife',
    price: '$120.00',
    currency: 'USD',
    category: 'Kitchenware',
    imageUrl: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&q=80&w=800',
    productUrl: 'https://cutlerycraft.jp/santoku-7in',
    status: 'available',
  },
]

export default function DemoProfilePage() {
  const [items, setItems] = useState<DemoItem[]>(INITIAL_DEMO_ITEMS)
  const [activeModalItem, setActiveModalItem] = useState<DemoItem | null>(null)
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [contactNote, setContactNote] = useState('')
  const [reservedSuccess, setReservedSuccess] = useState(false)
  const [simulatedToken, setSimulatedToken] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)

  const availableCount = items.filter((i) => i.status === 'available').length

  const handleOpenReserve = (item: DemoItem) => {
    setActiveModalItem(item)
    setReservedSuccess(false)
    setSimulatedToken('')
  }

  const handleConfirmReservation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeModalItem) return

    // Update demo item state
    setItems((prev) =>
      prev.map((i) => (i.id === activeModalItem.id ? { ...i, status: 'reserved' } : i))
    )
    const token = 'demo_token_' + Math.random().toString(36).substring(2, 10)
    setSimulatedToken(token)
    setReservedSuccess(true)
  }

  return (
    <main className="min-h-screen bg-cotton pb-20">
      {/* Demo Banner */}
      <div className="bg-ink text-white py-2.5 px-4 text-center text-xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-ribbon text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Sample Registry
            </span>
            <span>This is an interactive preview. Try reserving an item to see how private gifting works!</span>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs font-semibold text-cotton hover:text-white underline underline-offset-2"
          >
            <span>Create your own wishlist</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
        {/* Profile Registry Header */}
        <header className="paper-tag rounded-3xl p-6 sm:p-8 mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-parchment-light border border-parchment shrink-0 shadow-xs">
            <Image
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"
              alt="Maya Chen"
              width={112}
              height={112}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink tracking-tight">
                  Maya Chen&apos;s Wishlist
                </h1>
                <p className="text-sm text-slate-muted mt-0.5">@maya · Housewarming & Birthday</p>
              </div>

              <Link
                href="/login"
                className="bg-ink text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-ink/90 active:scale-98 transition-all shadow-xs self-center sm:self-auto"
              >
                Start Your Registry
              </Link>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-muted">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-parchment-light border border-parchment text-ink font-medium">
                <Gift className="w-3.5 h-3.5 text-ribbon" />
                {availableCount} {availableCount === 1 ? 'item available' : 'items available'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-spruce-light/60 border border-spruce/20 text-spruce font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-spruce" />
                Zero-leak delivery address protection
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
              {items.length} items total
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {items.map((item) => {
              const isReserved = item.status === 'reserved'

              return (
                <div
                  key={item.id}
                  className={`paper-tag rounded-3xl overflow-hidden flex flex-col justify-between transition-all group ${
                    isReserved ? 'opacity-75 bg-parchment-light/40' : 'hover:-translate-y-1 hover:shadow-md'
                  }`}
                >
                  <div className="relative aspect-4/3 w-full bg-parchment-light overflow-hidden border-b border-parchment">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-103 transition-transform duration-300"
                    />

                    {item.category && (
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-medium text-ink shadow-2xs border border-parchment/80">
                        {item.category}
                      </span>
                    )}

                    {isReserved && (
                      <div className="absolute inset-0 bg-ink/40 backdrop-blur-2xs flex items-center justify-center p-4">
                        <div className="bg-white text-ink px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md">
                          <CheckCircle2 className="w-4 h-4 text-spruce" />
                          <span>Reserved for Maya</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-1.5">
                      <h3 className="font-serif font-bold text-base text-ink line-clamp-2 leading-snug">
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-muted tabular-nums">
                          {item.price}
                        </span>
                        <a
                          href={item.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-muted hover:text-ink transition-colors"
                        >
                          <span>Store</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-parchment/60">
                      {isReserved ? (
                        <div className="w-full text-center py-2.5 rounded-xl bg-parchment text-slate-muted text-xs font-medium cursor-not-allowed">
                          Gift Claimed
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenReserve(item)}
                          className="w-full inline-flex items-center justify-center gap-2 bg-ink text-white hover:bg-ink/90 active:scale-98 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>Reserve Gift for Maya</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* Reservation Simulation Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 border border-parchment shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveModalItem(null)}
              className="absolute top-5 right-5 text-slate-muted hover:text-ink cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {!reservedSuccess ? (
              <form onSubmit={handleConfirmReservation} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-spruce bg-spruce-light px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
                    Interactive Reservation Demo
                  </span>
                  <h3 className="text-xl font-serif font-bold text-ink">
                    Reserve &ldquo;{activeModalItem.title}&rdquo;
                  </h3>
                  <p className="text-xs text-slate-muted leading-relaxed">
                    Reserving locks this gift so nobody else buys a duplicate. You will receive a private tracking link where Maya can securely disclose her shipping address.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-parchment-light border border-parchment space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink">Item Price:</span>
                    <span className="tabular-nums font-medium text-ink">{activeModalItem.price}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-muted">
                    <ShieldCheck className="w-4 h-4 text-spruce shrink-0" />
                    <span>Address will only be visible via your private token ticket.</span>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-ink">Anonymity</label>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setIsAnonymous(true)}
                        className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                          isAnonymous ? 'bg-ink text-white' : 'bg-parchment text-slate-muted'
                        }`}
                      >
                        Anonymous
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAnonymous(false)}
                        className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                          !isAnonymous ? 'bg-ink text-white' : 'bg-parchment text-slate-muted'
                        }`}
                      >
                        Include Name
                      </button>
                    </div>
                  </div>

                  {!isAnonymous && (
                    <input
                      type="text"
                      placeholder="Your name or a short note (e.g., Alex & Sam)"
                      value={contactNote}
                      onChange={(e) => setContactNote(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-parchment rounded-xl text-xs bg-white text-ink focus:outline-none focus:border-ink"
                    />
                  )}
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-ribbon hover:bg-ribbon-hover text-white py-3 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    Confirm Reservation
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModalItem(null)}
                    className="px-4 py-3 border border-parchment rounded-xl text-xs font-semibold text-slate-muted hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-2 space-y-4">
                <div className="w-12 h-12 bg-spruce-light text-spruce rounded-2xl flex items-center justify-center mx-auto border border-spruce/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-serif font-bold text-ink">
                    Gift Reserved in Demo!
                  </h3>
                  <p className="text-xs text-slate-muted max-w-sm mx-auto leading-relaxed">
                    Maya is notified. In real usage, your private tracker link uses a cryptographically secure token hash to unlock her address once approved.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-parchment-light border border-parchment text-left space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink">Simulated Tracker URL:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCopiedLink(true)
                        setTimeout(() => setCopiedLink(false), 2000)
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-ribbon hover:text-ribbon-hover cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-spruce" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-slate-muted truncate bg-white px-2.5 py-1.5 rounded-lg border border-parchment">
                    https://wishlink.app/reservations/demo#token={simulatedToken}
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModalItem(null)}
                    className="w-full bg-ink text-white py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Done Exploring
                  </button>
                  <Link
                    href="/login"
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-ribbon hover:bg-parchment-light transition-colors text-center"
                  >
                    Ready to create your own registry →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
