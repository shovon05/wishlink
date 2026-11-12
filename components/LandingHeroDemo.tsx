'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShieldCheck, Gift, Check, CornerDownLeft } from 'lucide-react'

const SAMPLE_ITEMS = [
  {
    url: 'https://shop.ceramiclab.com/artisan-kettle',
    title: 'Matte Ceramic Pour-Over Kettle',
    price: '$74.00',
    category: 'Kitchenware',
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=800',
  },
  {
    url: 'https://linencompany.com/french-flax-duvet',
    title: 'Washed French Flax Linen Duvet Cover',
    price: '$185.00',
    category: 'Home & Bedding',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800',
  },
  {
    url: 'https://soundcraft.fm/wireless-studio-phones',
    title: 'Open-Back Studio Headphones',
    price: '$199.00',
    category: 'Audio',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
  },
]

export default function LandingHeroDemo() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isReserved, setIsReserved] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)

  const activeItem = SAMPLE_ITEMS[selectedIndex]

  const handleSelect = (index: number) => {
    if (index === selectedIndex) return
    setIsSimulating(true)
    setIsReserved(false)
    setTimeout(() => {
      setSelectedIndex(index)
      setIsSimulating(false)
    }, 250)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Interactive Simulator Shell */}
      <div className="paper-tag rounded-3xl p-5 sm:p-7 space-y-5 text-left">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-parchment pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-ribbon animate-pulse" />
            <span className="text-xs font-semibold text-ink">Interactive Wishcard Simulator</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-muted">
            <span>Try sample links:</span>
            {SAMPLE_ITEMS.map((item, idx) => (
              <button
                key={item.category}
                type="button"
                onClick={() => handleSelect(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedIndex === idx
                    ? 'bg-ink text-white'
                    : 'bg-parchment-light hover:bg-parchment text-ink'
                }`}
              >
                {item.category.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* URL Input Bar Simulation */}
        <div className="relative">
          <div className="w-full px-4 py-3 rounded-2xl bg-parchment-light border border-parchment text-xs text-slate-muted font-mono flex items-center justify-between overflow-hidden">
            <span className="truncate pr-4 text-ink/80">{activeItem.url}</span>
            <span className="shrink-0 flex items-center gap-1 text-[11px] font-sans font-medium text-slate-muted bg-white px-2 py-0.5 rounded-md border border-parchment">
              <CornerDownLeft className="w-3 h-3 text-slate-muted" />
              Auto-scraped
            </span>
          </div>
        </div>

        {/* Resulting Parcel Card */}
        <div className={`transition-all duration-200 ${isSimulating ? 'opacity-40 scale-99' : 'opacity-100 scale-100'}`}>
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-parchment shadow-xs flex flex-col sm:flex-row items-center gap-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden relative border border-parchment bg-parchment-light shadow-2xs">
              <Image
                src={activeItem.image}
                alt={activeItem.title}
                fill
                sizes="112px"
                className="object-cover"
              />
              <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-medium text-ink border border-parchment">
                {activeItem.category}
              </span>
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left w-full">
              <h4 className="font-semibold text-base text-ink leading-snug">
                {activeItem.title}
              </h4>
              <p className="text-sm font-semibold text-slate-muted tabular-nums">
                {activeItem.price}
              </p>

              <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
                {!isReserved ? (
                  <button
                    type="button"
                    onClick={() => setIsReserved(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-ribbon text-white hover:bg-ribbon-hover active:scale-98 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Simulate Reservation</span>
                  </button>
                ) : (
                  <div className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-spruce-light text-spruce border border-spruce/30 px-4 py-2 rounded-xl text-xs font-medium">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Reserved · Address shared privately</span>
                  </div>
                )}

                <span className="text-[11px] text-slate-muted flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-spruce" />
                  Address hidden until reserved
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
