import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LandingHeroDemo from '@/components/LandingHeroDemo'
import {
  Gift,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  EyeOff,
  ShoppingBag,
  HelpCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userProfile = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle()
    userProfile = profile
  }

  const supportedStores = [
    { name: 'Amazon', category: 'Everything' },
    { name: 'Etsy', category: 'Handmade & Vintage' },
    { name: 'Target', category: 'Home & Living' },
    { name: 'Apple', category: 'Tech & Gadgets' },
    { name: 'Shopify Stores', category: 'Direct from Makers' },
    { name: 'Sephora', category: 'Beauty & Skincare' },
    { name: 'Williams Sonoma', category: 'Kitchen & Dining' },
    { name: 'Local Boutiques', category: 'Any Web URL' },
  ]

  const howItWorks = [
    {
      step: '01',
      title: 'Paste product links from any store',
      description: 'Add gifts from Amazon, independent makers, or local shops. We automatically extract photos, titles, and prices.',
    },
    {
      step: '02',
      title: 'Share your one private link',
      description: 'Add your Wishlink to your bio or send it to friends and family. Your residential address is never shown publicly.',
    },
    {
      step: '03',
      title: 'Friends reserve to stop duplicates',
      description: 'When someone picks an item, it locks in real-time. Double-gifting is impossible, and they get your address securely.',
    },
  ]

  const faqs = [
    {
      question: 'How do gifters send items without seeing my address?',
      answer:
        'Your home address is never public. When a friend reserves a gift, we send you a private notification. You approve sharing your address (or allow auto-share with default address), and it is revealed only to that verified gifter via a cryptographically hashed token ticket.',
    },
    {
      question: 'Can I add products from any store or country?',
      answer:
        'Yes! Wishlink is universal. You can paste a link from Amazon, boutique ateliers, Kickstarter, or custom shop URLs. If an online shop blocks automated crawlers, our instant manual entry lets you customize title, photo, and price in seconds.',
    },
    {
      question: 'Can I keep reserved gifts a surprise for my birthday or event?',
      answer:
        'Yes. You can turn on Spoiler-Free Mode in your dashboard. When active, you’ll receive delivery notifications to approve shipping without revealing which specific item was picked, keeping the gift a true surprise until you open it!',
    },
    {
      question: 'What if someone reserves an item but doesn’t buy it?',
      answer:
        'Reservations automatically expire after 14 days unless completed. You can also cancel an inactive reservation with one click from your dashboard activity center to return the item to available status.',
    },
  ]

  return (
    <main className="min-h-screen bg-cotton flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-parchment/80 bg-cotton/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-ink text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Gift className="w-4 h-4 text-cotton stroke-[2.2]" />
            </div>
            <span className="font-serif font-bold text-lg text-ink tracking-tight">
              Wishlink
            </span>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/demo"
              className="text-xs font-semibold text-slate-muted hover:text-ink hidden sm:inline-flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-parchment-light"
            >
              <span>Explore Demo Registry</span>
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                {userProfile?.username && !userProfile.username.startsWith('user_') && (
                  <Link
                    href={`/${userProfile.username}`}
                    className="text-xs font-medium text-slate-muted hover:text-ink hidden md:inline-block"
                  >
                    View my link
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="bg-ink text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-ink/90 transition-all cursor-pointer"
                >
                  My Dashboard
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-muted hover:text-ink transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="bg-ink text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-ink/90 active:scale-98 transition-all shadow-xs cursor-pointer"
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-parchment-light border border-parchment text-xs font-medium text-ink shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-ribbon" />
          <span>The privacy-first universal wishlist</span>
        </div>

        <div className="space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-ink tracking-tight leading-[1.08]">
            Everything you wish for. One private link.
          </h1>
          <p className="text-base sm:text-lg text-slate-muted leading-relaxed font-sans max-w-xl mx-auto">
            Create your wishlist from any store. Share it with friends. Let them reserve gifts without ever exposing your home address.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href={user ? '/dashboard' : '/login'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-ribbon text-white hover:bg-ribbon-hover active:scale-98 px-7 py-3.5 rounded-2xl text-sm font-semibold transition-all shadow-xs cursor-pointer"
          >
            <span>{user ? 'Go to my dashboard' : 'Create your free wishlist'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.2]" />
          </Link>

          <Link
            href="/demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-parchment text-ink hover:bg-parchment-light px-6 py-3.5 rounded-2xl text-sm font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <span>See Maya&apos;s Demo Wishlist</span>
            <ExternalLink className="w-4 h-4 text-slate-muted" />
          </Link>
        </div>

        <div className="text-xs text-slate-muted flex items-center justify-center gap-2 pt-1">
          <ShieldCheck className="w-4 h-4 text-spruce" />
          <span>Zero public addresses · Atomic duplicate prevention · Passkeys & Google sign in</span>
        </div>

        {/* Live Interactive Hero Demo Walkthrough */}
        <div className="pt-8">
          <LandingHeroDemo />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t border-parchment bg-white/70 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ribbon">
              Simple 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-ink">
              How Wishlink works
            </h2>
            <p className="text-sm text-slate-muted">
              Built for weddings, birthdays, baby showers, holidays, or everyday personal registries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {howItWorks.map((item) => (
              <div
                key={item.step}
                className="paper-tag rounded-3xl p-6 sm:p-7 space-y-4 hover:shadow-md transition-shadow relative"
              >
                <div className="w-10 h-10 rounded-2xl bg-ink text-white font-mono font-bold text-sm flex items-center justify-center">
                  {item.step}
                </div>
                <h3 className="font-serif font-bold text-lg text-ink">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-muted leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Stores Section */}
      <section className="py-16 sm:py-20 border-t border-parchment">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
          <div className="space-y-2 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-parchment-light border border-parchment text-xs font-semibold text-ink">
              <ShoppingBag className="w-3.5 h-3.5 text-ribbon" />
              <span>Universal Compatibility</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-ink">
              Add gifts from anywhere on the web
            </h2>
            <p className="text-xs sm:text-sm text-slate-muted">
              You aren&apos;t locked into a single retail ecosystem. Combine your favorites in one sleek list.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {supportedStores.map((store) => (
              <div
                key={store.name}
                className="p-4 rounded-2xl bg-white border border-parchment text-left shadow-2xs hover:border-ink/20 transition-all"
              >
                <p className="font-semibold text-sm text-ink">{store.name}</p>
                <p className="text-[11px] text-slate-muted mt-0.5">{store.category}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dedicated Privacy & Security Section */}
      <section className="py-16 sm:py-20 bg-parchment-light/40 border-t border-parchment">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-spruce-light text-spruce text-xs font-semibold border border-spruce/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero Address Leaks Guaranteed</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-ink tracking-tight">
                Privacy is not an afterthought. It&apos;s the entire foundation.
              </h2>
              <p className="text-sm text-slate-muted leading-relaxed">
                Traditional registries publish your home address for the world to see. Wishlink replaces this risk with cryptographic token verification and recipient consent.
              </p>
              <ul className="space-y-2 text-xs text-ink/80 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-spruce shrink-0" />
                  <span>Addresses are never returned in public profile API payloads.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-spruce shrink-0" />
                  <span>Tokens are hashed with SHA-256 before database storage.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-spruce shrink-0" />
                  <span>14-day reservation auto-expiry frees up abandoned gifts.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-spruce shrink-0" />
                  <span>Spoiler-Free mode hides item titles from notifications so surprises stay safe.</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link
                  href="/privacy"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-ribbon hover:text-ribbon-hover"
                >
                  <span>Read our full Privacy Policy</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="paper-tag rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm bg-white">
              <div className="flex items-center gap-3 border-b border-parchment pb-4">
                <div className="w-10 h-10 rounded-xl bg-spruce-light text-spruce flex items-center justify-center">
                  <EyeOff className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-ink">Recipient-Controlled Disclosures</h4>
                  <p className="text-xs text-slate-muted">1-to-1 secure delivery handoffs</p>
                </div>
              </div>
              <div className="space-y-3 text-xs text-slate-muted leading-relaxed">
                <p>
                  1. A gifter reserves an item on your public link.
                </p>
                <p>
                  2. You receive an in-app ping and decide whether to share your home, office, or P.O. box.
                </p>
                <p>
                  3. If you enable &ldquo;Auto-share default address&rdquo;, verified gifters receive it instantly, while the general public still sees zero address data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24 border-t border-parchment">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-parchment-light border border-parchment text-xs font-semibold text-ink">
              <HelpCircle className="w-3.5 h-3.5 text-ribbon" />
              <span>Questions & Answers</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-ink">
              Frequently asked questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="paper-tag rounded-2xl p-5 sm:p-6 space-y-2.5 bg-white"
              >
                <h3 className="font-serif font-bold text-base text-ink leading-snug">
                  {faq.question}
                </h3>
                <p className="text-xs text-slate-muted leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Callout Banner */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto paper-tag rounded-3xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden bg-white shadow-sm">
          <div className="space-y-2 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-ink">
              Ready to start your private wishlist?
            </h2>
            <p className="text-sm text-slate-muted max-w-md mx-auto">
              Claim your unique handle in seconds. Add products from anywhere on the web.
            </p>
          </div>

          <div className="pt-2 relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={user ? '/dashboard' : '/login'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-ink text-white hover:bg-ink/90 active:scale-98 px-6 py-3.5 rounded-2xl text-sm font-semibold transition-all shadow-xs cursor-pointer"
            >
              <span>{user ? 'Open Dashboard' : 'Claim your Wishlink now'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-parchment-light border border-parchment text-ink hover:bg-parchment px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all cursor-pointer"
            >
              <span>View Interactive Demo</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-parchment py-10 text-xs text-slate-muted bg-white/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-ribbon" />
            <span className="font-semibold text-ink">Wishlink</span>
            <span>— The privacy-first universal wishlist</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link href="/demo" className="hover:text-ink transition-colors">Sample Registry</Link>
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-ink transition-colors">Terms of Service</Link>
            <a href="mailto:support@wishlink.app" className="hover:text-ink transition-colors">Contact Support</a>
            <Link href="/login" className="hover:text-ink transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
