import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NotificationBell from '@/components/NotificationBell'
import MyGiftReservations from '@/components/MyGiftReservations'
import { Gift, ExternalLink, MapPin, Bell, ShieldCheck, ListOrdered, LogOut } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, pet_name')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.username?.startsWith('user_')) {
    redirect('/onboarding')
  }

  const username = profile.username

  return (
    <div className="min-h-screen bg-cotton flex flex-col selection:bg-blush/50 selection:text-ink">
      {/* Top Studio Header */}
      <header className="border-b border-parchment bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-mocha text-cotton flex items-center justify-center shadow-xs border border-caramel/20 group-hover:scale-105 transition-transform">
                <Gift className="w-4 h-4 text-blush stroke-[2.2]" />
              </div>
              <span className="font-serif font-bold text-lg text-ink tracking-tight">
                Wishlink
              </span>
            </Link>

            {/* Quick public link pill */}
            <Link
              href={`/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-muted hover:text-ink bg-parchment-light hover:bg-parchment transition-all border border-parchment shadow-2xs"
            >
              <span>wishlink.me/{username}</span>
              <ExternalLink className="w-3 h-3 text-caramel" />
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile quick link to public profile */}
            <Link
              href={`/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View your public wishlist"
              className="sm:hidden p-2 text-slate-muted hover:text-ink hover:bg-parchment-light rounded-xl transition-all cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <ExternalLink className="w-4 h-4 text-caramel" />
            </Link>

            <MyGiftReservations />
            <NotificationBell userId={user.id} />

            <div className="w-px h-5 bg-parchment hidden sm:block" />

            <form action="/auth/signout" method="post" className="hidden sm:block">
              <button
                type="submit"
                className="text-xs font-semibold text-slate-muted hover:text-ribbon transition-colors flex items-center gap-1.5 cursor-pointer px-2.5 py-1.5 rounded-xl hover:bg-parchment-light/60 min-h-[36px]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </form>

            {/* Mobile sign out icon button */}
            <form action="/auth/signout" method="post" className="sm:hidden">
              <button
                type="submit"
                title="Sign Out"
                className="p-2 text-slate-muted hover:text-ribbon hover:bg-ribbon-light rounded-xl transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Desktop Secondary Tab Bar */}
        <div className="border-t border-parchment/60 bg-cotton/60 backdrop-blur-xs">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-ink hover:bg-white hover:shadow-2xs transition-all shrink-0 min-h-[36px]"
            >
              <ListOrdered className="w-3.5 h-3.5 text-caramel" />
              <span>Wishlist Studio</span>
            </Link>

            <Link
              href="/dashboard/addresses"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-muted hover:text-ink hover:bg-white transition-all shrink-0 min-h-[36px]"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-muted" />
              <span>Shipping Addresses</span>
            </Link>

            <Link
              href="/dashboard/notifications"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-muted hover:text-ink hover:bg-white transition-all shrink-0 min-h-[36px]"
            >
              <Bell className="w-3.5 h-3.5 text-slate-muted" />
              <span>Gifting Requests</span>
            </Link>

            <Link
              href="/dashboard/security"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-muted hover:text-ink hover:bg-white transition-all shrink-0 min-h-[36px]"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-muted" />
              <span>Security & 2FA</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 sm:pb-12">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav 
        aria-label="Mobile Navigation"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-parchment px-2 py-1.5 flex items-center justify-around md-elevation-3"
      >
        <Link 
          href="/dashboard" 
          className="flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-ink p-2 min-h-[48px] min-w-[64px] rounded-xl active:bg-parchment-light transition-colors"
        >
          <ListOrdered className="w-4 h-4 text-caramel" />
          <span>Wishlist</span>
        </Link>
        <Link 
          href="/dashboard/addresses" 
          className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-slate-muted hover:text-ink p-2 min-h-[48px] min-w-[64px] rounded-xl active:bg-parchment-light transition-colors"
        >
          <MapPin className="w-4 h-4" />
          <span>Addresses</span>
        </Link>
        <Link 
          href="/dashboard/notifications" 
          className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-slate-muted hover:text-ink p-2 min-h-[48px] min-w-[64px] rounded-xl active:bg-parchment-light transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span>Requests</span>
        </Link>
        <Link 
          href="/dashboard/security" 
          className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-slate-muted hover:text-ink p-2 min-h-[48px] min-w-[64px] rounded-xl active:bg-parchment-light transition-colors"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security</span>
        </Link>
      </nav>
    </div>
  )
}
