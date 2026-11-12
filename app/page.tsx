import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LandingHeroDemo from '@/components/LandingHeroDemo'
import { Gift, ShieldCheck, Link2, Sparkles, ArrowRight, Lock } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userProfile = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
    userProfile = profile
  }

  const features = [
    {
      icon: Link2,
      title: 'Universal link scraping',
      description: 'Paste any product link from Amazon, boutique ateliers, or local shops. We pull in photos, titles, and prices automatically.',
    },
    {
      icon: ShieldCheck,
      title: 'Private shipping addresses',
      description: 'Your physical address is never shown publicly. You grant 1-to-1 access only after a gifter confirms their reservation.',
    },
    {
      icon: Lock,
      title: 'Double-gift protection',
      description: 'Atomic database locks prevent awkward duplicate purchases. Once reserved, an item is locked in real-time.',
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
            {user ? (
              <div className="flex items-center gap-3">
                {userProfile?.username && !userProfile.username.startsWith('user_') && (
                  <Link
                    href={`/${userProfile.username}`}
                    className="text-xs font-medium text-slate-muted hover:text-ink hidden sm:inline-block"
                  >
                    View public registry
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
            One link for everything you wish for
          </h1>
          <p className="text-base sm:text-lg text-slate-muted leading-relaxed font-sans max-w-xl mx-auto">
            Build a tactile registry, drop the link in your bio, and let friends reserve gifts without leaking your residential address.
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

          <span className="text-xs text-slate-muted flex items-center gap-1.5 pt-1 sm:pt-0">
            <ShieldCheck className="w-4 h-4 text-spruce" />
            No password required · Passkeys & Google
          </span>
        </div>

        {/* Live Interactive Hero Demo Simulator */}
        <div className="pt-8">
          <LandingHeroDemo />
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="border-t border-parchment bg-white/60 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-ink">
              Designed for thoughtful gifting
            </h2>
            <p className="text-sm text-slate-muted">
              Everything you need to share what you love while keeping your boundaries intact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="paper-tag rounded-3xl p-6 sm:p-7 space-y-4 hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 rounded-2xl bg-parchment-light border border-parchment flex items-center justify-center text-ink">
                    <Icon className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-ink">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-muted leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Final Callout Banner */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto paper-tag rounded-3xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-ink">
              Ready to start your registry?
            </h2>
            <p className="text-sm text-slate-muted max-w-md mx-auto">
              Takes less than 60 seconds to claim your unique link and paste your first gift item.
            </p>
          </div>

          <div className="pt-2 relative z-10">
            <Link
              href={user ? '/dashboard' : '/login'}
              className="inline-flex items-center gap-2 bg-ink text-white hover:bg-ink/90 active:scale-98 px-6 py-3.5 rounded-2xl text-sm font-semibold transition-all shadow-xs cursor-pointer"
            >
              <span>{user ? 'Open Dashboard' : 'Claim your Wishlink now'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-parchment py-8 text-center text-xs text-slate-muted">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-ribbon" />
            <span className="font-semibold text-ink">Wishlink</span>
            <span>— Privacy-first registries</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-ink transition-colors">Sign In</Link>
            <span>·</span>
            <span>Built with Next.js & Supabase</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
