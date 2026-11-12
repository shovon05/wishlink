'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Link2,
  Sparkles,
  Gift,
  Bell,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  RotateCcw,
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff
} from 'lucide-react'

interface DemoStep {
  step: number
  title: string
  subtitle: string
  description: string
}

const STEPS: DemoStep[] = [
  {
    step: 1,
    title: 'Curate From Any Atelier',
    subtitle: 'From Amazon, Etsy, Apple, or boutique shops',
    description: 'Paste the direct product URL. Wishlink automatically extracts high-res photography, titles, and live prices without manual re-typing.',
  },
  {
    step: 2,
    title: 'Bespoke Structured Wishcard',
    subtitle: 'Organized with real-time price & category',
    description: 'The product is cataloged seamlessly into your private list. You can reorganize items via drag-and-drop or mark priority gifts.',
  },
  {
    step: 3,
    title: 'Gifter Locks & Reserves',
    subtitle: 'Atomic lock prevents duplicate purchases',
    description: 'When a friend decides to surprise you, they reserve it with one click. The item locks in real time so double-gifting is impossible.',
  },
  {
    step: 4,
    title: 'Private Studio Ping',
    subtitle: 'Spoiler-Free mode protects the surprise',
    description: 'You get an immediate in-app ping. With Spoiler-Free mode enabled, the item title stays hidden so your celebration remains a true surprise!',
  },
  {
    step: 5,
    title: 'Authorize Destination 1-to-1',
    subtitle: 'Disclose 1-to-1 or auto-share your default',
    description: 'You decide when and where to send the gift. Your residential address is never revealed to the public web.',
  },
  {
    step: 6,
    title: 'Private Encrypted Delivery Ticket',
    subtitle: 'Hashed token unlocks delivery details',
    description: 'The gifter’s private tracker ticket unlocks the exact shipping destination with one-click copy to paste directly on the merchant site.',
  },
]

export default function LandingHeroDemo() {
  const [currentStep, setCurrentStep] = useState(1)
  const [spoilerMode, setSpoilerMode] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)

  const activeStepMeta = STEPS[currentStep - 1]

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Container */}
      <div className="paper-tag rounded-3xl p-5 sm:p-7 space-y-6 text-left shadow-xs border border-parchment bg-white">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-parchment pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-caramel animate-pulse" />
            <span className="text-xs font-serif font-bold text-ink">Interactive Gifting Walkthrough</span>
            <span className="text-[10px] font-mono font-bold text-caramel bg-caramel-light border border-caramel/30 px-2 py-0.5 rounded-full uppercase">
              Interactive Preview
            </span>
          </div>

          {/* Step Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {STEPS.map((s) => (
              <button
                key={s.step}
                type="button"
                onClick={() => setCurrentStep(s.step)}
                className={`w-7 h-7 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  currentStep === s.step
                    ? 'bg-mocha text-cotton shadow-xs border border-mocha/40 scale-105'
                    : currentStep > s.step
                    ? 'bg-blush/50 text-mocha border border-blush/80'
                    : 'bg-parchment-light/80 text-slate-muted hover:text-ink hover:bg-parchment'
                }`}
                title={`Step ${s.step}: ${s.title}`}
              >
                {s.step}
              </button>
            ))}
          </div>
        </div>

        {/* Step Context Banner */}
        <div className="bg-parchment-light/40 rounded-2xl p-4 border border-parchment flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ribbon">
                Step {activeStepMeta.step} of 6
              </span>
              <span className="text-parchment text-xs">·</span>
              <span className="text-xs font-serif font-bold text-ink">{activeStepMeta.title}</span>
            </div>
            <p className="text-xs text-slate-muted">{activeStepMeta.description}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {currentStep < 6 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
                className="posh-button-primary inline-flex items-center gap-1 text-xs font-semibold px-3.5 py-1.5 rounded-xl cursor-pointer shadow-2xs"
              >
                <span>Next Step</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1 text-xs font-semibold bg-white border border-parchment text-ink px-3 py-1.5 rounded-xl hover:bg-parchment-light cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-caramel" />
                <span>Restart</span>
              </button>
            )}
          </div>
        </div>

        {/* Interactive Screen Visualization */}
        <div className="min-h-[220px] flex items-center justify-center">

          {/* STEP 1: Paste Link */}
          {currentStep === 1 && (
            <div className="w-full space-y-4 animate-in fade-in duration-200">
              <div className="text-xs font-semibold text-slate-muted">Simulated Atelier Product URL Input:</div>
              <div className="w-full p-3.5 rounded-2xl bg-white border border-parchment shadow-2xs flex items-center justify-between gap-3 font-mono text-xs text-ink/80">
                <div className="flex items-center gap-2 truncate">
                  <Link2 className="w-4 h-4 text-caramel shrink-0" />
                  <span className="truncate">https://atelier-ceramics.com/matte-pour-over-kettle</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="shrink-0 bg-mocha text-cotton px-3.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-mocha-hover transition-colors cursor-pointer"
                >
                  Extract
                </button>
              </div>
              <div className="text-[11px] text-slate-muted flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-caramel" />
                <span>Universal metadata engine pulls price, imagery, and product name automatically.</span>
              </div>
            </div>
          )}

          {/* STEP 2: Extracted Product Card */}
          {currentStep === 2 && (
            <div className="w-full p-4 sm:p-5 rounded-2xl bg-white border border-parchment shadow-2xs flex flex-col sm:flex-row items-center gap-5 animate-in fade-in duration-200">
              <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl overflow-hidden relative border border-parchment bg-parchment-light">
                <Image
                  src="https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=800"
                  alt="Ceramic Kettle"
                  fill
                  sizes="112px"
                  className="object-cover"
                />
                <span className="absolute top-2 left-2 bg-white/95 px-2 py-0.5 rounded-full text-[10px] font-semibold text-ink border border-parchment">
                  Kitchenware
                </span>
              </div>
              <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                <h4 className="font-serif font-bold text-base text-ink">
                  Matte Ceramic Pour-Over Kettle
                </h4>
                <p className="text-sm font-semibold text-slate-muted tabular-nums">
                  $74.00 USD
                </p>
                <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="posh-button-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5 text-blush" />
                    <span>See Gifter&apos;s View →</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Gifter Reserves Item */}
          {currentStep === 3 && (
            <div className="w-full p-5 rounded-2xl bg-white border border-parchment shadow-2xs space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-parchment pb-3">
                <span className="text-xs font-serif font-bold text-ink">Gifter View (Public Registry)</span>
                <span className="text-[11px] text-spruce bg-spruce-light border border-spruce/30 px-2.5 py-0.5 rounded-full font-semibold">
                  Personal Address Hidden
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-serif font-bold text-sm text-ink">Matte Ceramic Pour-Over Kettle</h4>
                  <p className="text-xs text-slate-muted">$74.00 USD · Reserved exclusively for this gift</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="posh-button-rose px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                >
                  Reserve This Gift
                </button>
              </div>

              <div className="p-3 rounded-xl bg-parchment-light/40 border border-parchment text-[11px] text-slate-muted">
                🛡️ Once reserved, an atomic database lock prevents anyone else from purchasing a duplicate.
              </div>
            </div>
          )}

          {/* STEP 4: Recipient Notification & Spoiler-Free Mode */}
          {currentStep === 4 && (
            <div className="w-full p-5 rounded-2xl bg-white border border-parchment shadow-2xs space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-parchment pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-ribbon" />
                  <span className="text-xs font-serif font-bold text-ink">Your Dashboard Notification</span>
                </div>

                {/* Spoiler-Free Toggle Demo */}
                <button
                  type="button"
                  onClick={() => setSpoilerMode(!spoilerMode)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border border-parchment bg-parchment-light hover:bg-parchment cursor-pointer transition-colors"
                >
                  {spoilerMode ? <EyeOff className="w-3 h-3 text-ribbon" /> : <Eye className="w-3 h-3 text-caramel" />}
                  <span>{spoilerMode ? 'Spoiler Mode: ON' : 'Spoiler Mode: OFF'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-parchment-light/40 border border-parchment flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blush/40 text-mocha border border-blush flex items-center justify-center shrink-0">
                  <Gift className="w-4 h-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-ink">Someone wants to gift you!</p>
                    <span className="text-[10px] text-slate-muted">Just now</span>
                  </div>
                  <p className="text-xs text-slate-muted">
                    {spoilerMode
                      ? 'A gift from your wishlist (hidden to keep it a surprise for your celebration).'
                      : 'Item: "Matte Ceramic Pour-Over Kettle" — choose where to ship it.'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="posh-button-primary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Choose Delivery Address →
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Recipient Approves Address */}
          {currentStep === 5 && (
            <div className="w-full p-5 rounded-2xl bg-white border border-parchment shadow-2xs space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-parchment pb-3">
                <span className="text-xs font-serif font-bold text-ink">Select Private Destination</span>
                <span className="text-[11px] font-mono text-slate-muted">Step 5 of 6</span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink block">Which address should we share?</label>
                <div className="p-3 rounded-xl border border-caramel bg-caramel-light/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-caramel shrink-0" />
                    <div>
                      <span className="font-bold text-ink">Primary Residence (Default)</span>
                      <p className="text-[11px] text-slate-muted">742 Evergreen Terrace, Springfield OR 97477</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-caramel shrink-0" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-muted">
                  🔒 Gifter receives address via single-use encrypted token link.
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(6)}
                  className="posh-button-primary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Share Address Privately
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Delivery Tracking Revealed to Gifter */}
          {currentStep === 6 && (
            <div className="w-full p-5 rounded-2xl bg-white border border-parchment shadow-2xs space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-parchment pb-3">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-caramel" />
                  <span className="text-xs font-serif font-bold text-ink">Gifter&apos;s Private Delivery Ticket</span>
                </div>
                <span className="text-[10px] font-mono text-slate-muted">#token=a8f4c9...</span>
              </div>

              <div className="p-4 rounded-xl bg-parchment-light/40 border border-parchment space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink">Recipient Shipping Address:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCopiedAddress(true)
                      setTimeout(() => setCopiedAddress(false), 2000)
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-ribbon hover:text-ribbon-hover cursor-pointer"
                  >
                    {copiedAddress ? <Check className="w-3 h-3 text-spruce" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedAddress ? 'Copied' : 'Copy Address'}</span>
                  </button>
                </div>
                <p className="text-xs font-medium text-ink bg-white p-2.5 rounded-lg border border-parchment">
                  Alex Rivera<br />
                  742 Evergreen Terrace, Apt 4B<br />
                  Springfield, OR 97477
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <a
                  href="https://store.ceramiclab.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-slate-muted hover:text-ink font-medium"
                >
                  <span>Go buy on merchant site</span>
                  <ExternalLink className="w-3 h-3 text-caramel" />
                </a>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-ink hover:text-slate-muted cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-caramel" />
                  <span>Try again from start</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
