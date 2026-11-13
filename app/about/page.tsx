import Link from 'next/link'
import { Gift, ShieldCheck, Lock, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'About WishLink — Privacy-First Gift Registry',
  description: 'Learn how WishLink protects recipient delivery addresses with explicit per-request consent and secure gift coordination.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cotton flex flex-col selection:bg-blush/50 selection:text-ink">
      {/* Navigation Header */}
      <header className="border-b border-parchment bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-mocha text-cotton flex items-center justify-center shadow-xs border border-caramel/20 group-hover:scale-105 transition-transform">
              <Gift className="w-4 h-4 text-blush stroke-[2.2]" />
            </div>
            <span className="font-serif font-bold text-lg text-ink tracking-tight">
              Wishlink
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-muted hover:text-ink transition-colors px-3 py-2 rounded-xl"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="posh-button-primary px-4 py-2 rounded-xl text-xs font-semibold"
            >
              Open Studio
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-spruce-light text-spruce border border-spruce/30">
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy-First Gifting</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-ink tracking-tight leading-tight">
            Gifting with complete peace of mind.
          </h1>

          <p className="text-sm sm:text-base text-slate-muted leading-relaxed">
            WishLink is designed around one fundamental rule: your home address and private contact details are never visible on your public profile, and are never shared automatically.
          </p>
        </div>

        {/* 3 Core Architecture Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="paper-tag rounded-3xl p-6 bg-white border border-parchment space-y-3 md-elevation-1">
            <div className="w-10 h-10 rounded-xl bg-parchment-light border border-parchment flex items-center justify-center text-caramel">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-serif font-bold text-ink">Explicit Consent</h3>
            <p className="text-xs text-slate-muted leading-relaxed">
              When someone reserves an item, they receive only a reservation ticket. You receive a notification and decide which address to approve for that specific gift.
            </p>
          </div>

          <div className="paper-tag rounded-3xl p-6 bg-white border border-parchment space-y-3 md-elevation-1">
            <div className="w-10 h-10 rounded-xl bg-parchment-light border border-parchment flex items-center justify-center text-caramel">
              <Gift className="w-5 h-5" />
            </div>
            <h3 className="text-base font-serif font-bold text-ink">Universal Registry</h3>
            <p className="text-xs text-slate-muted leading-relaxed">
              Add products from any merchant or store on the web. WishLink automatically extracts title, product image, and price, giving your guests a clean link to purchase directly.
            </p>
          </div>

          <div className="paper-tag rounded-3xl p-6 bg-white border border-parchment space-y-3 md-elevation-1">
            <div className="w-10 h-10 rounded-xl bg-parchment-light border border-parchment flex items-center justify-center text-caramel">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="text-base font-serif font-bold text-ink">Surprise Mode</h3>
            <p className="text-xs text-slate-muted leading-relaxed">
              Prefer gifts to remain a genuine surprise? Turn on Surprise Mode to conceal which wishlist items were reserved, while still letting you approve shipping destinations.
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="paper-tag rounded-3xl p-8 sm:p-10 bg-white border border-parchment space-y-8 md-elevation-1">
          <div className="space-y-1">
            <h2 className="text-2xl font-serif font-bold text-ink tracking-tight">
              How WishLink Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-muted">
              Step-by-step gift coordination without exposing personal data.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-muted">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-serif font-bold text-sm text-ink">
                <span className="w-6 h-6 rounded-full bg-caramel/20 text-caramel flex items-center justify-center text-xs">1</span>
                <span>Create Your Registry</span>
              </div>
              <p className="leading-relaxed pl-8">
                Paste item URLs from any retailer. Organize your list with priority tags and custom notes.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 font-serif font-bold text-sm text-ink">
                <span className="w-6 h-6 rounded-full bg-caramel/20 text-caramel flex items-center justify-center text-xs">2</span>
                <span>Share Your Public Link</span>
              </div>
              <p className="leading-relaxed pl-8">
                Your guests visit wishlink.me/yourname. Your wishlist is clean and readable, with zero personal contact details.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 font-serif font-bold text-sm text-ink">
                <span className="w-6 h-6 rounded-full bg-caramel/20 text-caramel flex items-center justify-center text-xs">3</span>
                <span>Guest Reserves a Gift</span>
              </div>
              <p className="leading-relaxed pl-8">
                The item is marked as reserved to prevent duplicate gifts. The guest receives a secure private ticket link.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 font-serif font-bold text-sm text-ink">
                <span className="w-6 h-6 rounded-full bg-caramel/20 text-caramel flex items-center justify-center text-xs">4</span>
                <span>You Approve Delivery</span>
              </div>
              <p className="leading-relaxed pl-8">
                You review the reservation in your studio and choose which shipping destination to disclose. You can revoke access at any time.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-parchment flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-muted">
              Ready to start your private wishlist?
            </p>
            <Link
              href="/login"
              className="posh-button-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Platform Boundaries: What WishLink Does Not Do */}
        <div className="paper-tag rounded-3xl p-6 sm:p-8 bg-parchment-light/40 border border-parchment space-y-4">
          <h2 className="text-base font-serif font-bold text-ink">
            What WishLink Does Not Do
          </h2>
          <ul className="space-y-2 text-xs text-slate-muted">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-caramel shrink-0 mt-0.5" />
              <span>We do not process merchant payments. Gifting guests purchase directly on the merchant&apos;s website.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-caramel shrink-0 mt-0.5" />
              <span>We do not sell user data, track users across the web, or run third-party advertising trackers.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-caramel shrink-0 mt-0.5" />
              <span>We cannot remotely erase an address once a guest has viewed, copied, or recorded it. We revoke further server retrieval immediately upon your request.</span>
            </li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-parchment py-8 px-4 text-center text-xs text-slate-muted">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-ink">Wishlink</span>
            <span>— Privacy-first gifting platform</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <Link href="/about" className="hover:text-ink transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-ink transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
