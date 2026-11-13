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
    { name: 'Shopify Boutiques', category: 'Independent Makers' },
    { name: 'Sephora', category: 'Beauty & Skincare' },
    { name: 'Williams Sonoma', category: 'Kitchen & Dining' },
    { name: 'Ateliers & Galleries', category: 'Any Web URL' },
  ]

  const howItWorks = [
    {
      step: '01',
      title: 'Curate product links from any store',
      description: 'Add gifts from global retailers, bespoke makers, or local ateliers. Our engine automatically pulls photos, titles, and live prices.',
    },
    {
      step: '02',
      title: 'Share your single private link',
      description: 'Place your Wishlink in your bio or send it to friends. Your residential home address is never revealed to the public.',
    },
    {
      step: '03',
      title: 'Friends reserve to prevent duplicates',
      description: 'When an item is reserved, it locks in real-time. Double-gifting is impossible, and gifters receive your shipping details securely after your approval.',
    },
  ]

  const faqs = [
    {
      question: 'How do gifters send items without seeing my personal address?',
      answer:
        'Your home address is never public. When a friend reserves a gift, we send you a private notification. You choose which destination to approve for that specific gift, and it is revealed only to that verified gifter via a cryptographically hashed token ticket. You can revoke access at any time.',
    },
    {
      question: 'Can I add products from any atelier or country?',
      answer:
        'Yes. Wishlink is completely universal. You can paste a link from Amazon, boutique ateliers, Kickstarter, or custom shop URLs. If an online shop blocks automated crawlers, our instant manual entry lets you customize title, photo, and price in seconds.',
    },
    {
      question: 'Can I keep reserved gifts a surprise for my celebration?',
      answer:
        'Yes. You can turn on Surprise Mode in your dashboard. When active, you will receive delivery notifications to approve shipping without revealing which specific item was picked, keeping the gift a true surprise until you open it!',
    },
    {
      question: 'What if someone reserves an item but doesn’t buy it?',
      answer:
        'Reservations automatically expire after 14 days unless completed. You can also decline or cancel an inactive reservation with one click from your dashboard activity center to return the item to available status.',
    },
  ]

  return (
    <main className="min-h-screen bg-cotton flex flex-col justify-between selection:bg-blush/50 selection:text-ink">
      {/* Top Navbar */}
      <header className="border-b border-parchment/80 bg-cotton/90 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-mocha text-cotton flex items-center justify-center shadow-xs border border-caramel/25 group-hover:scale-105 transition-transform">
              <Gift className="w-4 h-4 text-blush stroke-[2.2]" />
            </div>
            <span className="font-serif font-bold text-lg text-ink tracking-tight">
              Wishlink
            </span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/about"
              className="text-xs font-semibold text-slate-muted hover:text-ink transition-colors px-2.5 py-1.5 rounded-xl hover:bg-parchment-light/80"
            >
              About
            </Link>

            <Link
              href="/demo"
              className="text-xs font-semibold text-slate-muted hover:text-ink hidden sm:inline-flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-xl hover:bg-parchment-light/80"
            >
              <span>Explore Demo</span>
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                {userProfile?.username && !userProfile.username.startsWith('user_') && (
                  <Link
                    href={`/${userProfile.username}`}
                    className="text-xs font-semibold text-slate-muted hover:text-ink hidden md:inline-block px-2.5 py-1.5"
                  >
                    View my link
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="posh-button-primary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  My Dashboard
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/login"
                  className="px-3 py-2 text-xs font-semibold text-slate-muted hover:text-ink transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="posh-button-primary px-4 py-2 rounded-xl text-xs font-semibold active:scale-98 cursor-pointer"
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 text-center space-y-8 relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-caramel-light border border-caramel/30 text-xs font-semibold text-caramel shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-caramel" />
          <span>The privacy-first universal registry</span>
        </div>

        <div className="space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-ink tracking-tight leading-[1.08]">
            Everything you wish for. One private link.
          </h1>
          <p className="text-base sm:text-lg text-slate-muted font-sans font-normal max-w-xl mx-auto leading-relaxed">
            Create an aesthetic wishlist with items from any shop in the world. Share with confidence—your residential shipping address is disclosed only with your explicit approval.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href={user ? '/dashboard' : '/login'}
            className="w-full sm:w-auto posh-button-primary inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold cursor-pointer shadow-xs min-h-[44px]"
          >
            <span>{user ? 'Enter Wishlist Studio' : 'Create your Wishlink'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-parchment hover:border-caramel/40 text-ink hover:bg-parchment-light/60 px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all cursor-pointer min-h-[44px]"
          >
            <EyeOff className="w-4 h-4 text-caramel" />
            <span>Interactive Demo</span>
          </Link>
        </div>

        {/* Live Interactive Demo Widget */}
        <div className="pt-8">
          <LandingHeroDemo />
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 sm:py-24 border-t border-parchment/60 bg-white/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-2 max-w-lg mx-auto">
            <h2 className="text-xs font-bold text-caramel uppercase tracking-widest font-mono">
              Designed For Real Gifting
            </h2>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-ink">
              Three simple steps to mindful gifting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {howItWorks.map((item) => (
              <div
                key={item.step}
                className="paper-tag rounded-3xl p-6 sm:p-7 space-y-4 bg-white border border-parchment transition-all hover:border-caramel/40 hover:-translate-y-0.5 md-elevation-1"
              >
                <span className="font-serif font-bold text-3xl text-caramel/30 block">
                  {item.step}
                </span>
                <h3 className="font-serif font-bold text-lg text-ink">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-muted leading-relaxed font-sans">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Store Compatibility Strip */}
      <section className="py-12 border-t border-parchment/60 bg-cotton">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6 text-center">
          <p className="text-xs font-bold text-slate-muted uppercase tracking-wider font-mono">
            Works with any online store worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {supportedStores.map((store) => (
              <div
                key={store.name}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-parchment shadow-2xs text-xs font-medium text-ink"
              >
                <ShoppingBag className="w-3 h-3 text-caramel" />
                <span>{store.name}</span>
                <span className="text-[10px] text-slate-muted/70">({store.category})</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Callout */}
      <section className="py-16 sm:py-20 border-t border-parchment/60 bg-white/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="paper-tag rounded-3xl p-8 sm:p-12 border border-parchment bg-white md-elevation-2 flex flex-col md:flex-row items-center gap-8">
            <div className="w-16 h-16 rounded-2xl bg-spruce-light border border-spruce/30 flex items-center justify-center shrink-0 text-spruce">
              <ShieldCheck className="w-8 h-8 stroke-[1.8]" />
            </div>
            <div className="space-y-2 text-center md:text-left flex-1">
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-ink">
                Your residential address stays confidential.
              </h3>
              <p className="text-xs sm:text-sm text-slate-muted leading-relaxed">
                Traditional registries publish your home city and full name to anyone with the link. WishLink uses cryptographically signed tokens and explicit per-request owner consent. Only approved gifters receive delivery directions.
              </p>
            </div>
            <Link
              href="/privacy"
              className="posh-button-primary shrink-0 px-5 py-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 min-h-[44px]"
            >
              <span>Our Privacy Model</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-16 sm:py-24 border-t border-parchment/60 bg-cotton">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-caramel font-mono uppercase tracking-widest">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Questions & Answers</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-ink">
              Everything you need to know
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="paper-tag rounded-2xl p-5 sm:p-6 bg-white border border-parchment space-y-2 md-elevation-1"
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
        <div className="max-w-3xl mx-auto paper-tag rounded-3xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden bg-white border border-parchment shadow-sm">
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
              className="w-full sm:w-auto posh-button-primary inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold cursor-pointer shadow-xs min-h-[44px]"
            >
              <span>{user ? 'Open Dashboard' : 'Claim your Wishlink now'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-parchment hover:border-caramel/40 text-ink hover:bg-parchment-light/60 px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all cursor-pointer min-h-[44px]"
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
            <span className="font-serif font-bold text-ink">Wishlink</span>
            <span>— The privacy-first universal registry</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link href="/about" className="hover:text-ink transition-colors">About</Link>
            <Link href="/demo" className="hover:text-ink transition-colors">Sample Registry</Link>
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-ink transition-colors">Terms of Service</Link>
            <a href="mailto:support@wishlink.me" className="hover:text-ink transition-colors">Contact Support</a>
            <Link href="/login" className="hover:text-ink transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
