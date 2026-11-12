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
    <div className="min-h-screen bg-cotton flex flex-col">
      {/* Top Studio Header */}
      <header className="border-b border-parchment bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-ink text-white flex items-center justify-center shadow-xs">
                <Gift className="w-4 h-4 text-cotton stroke-[2.2]" />
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
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-muted hover:text-ink bg-parchment-light hover:bg-parchment transition-all border border-parchment"
            >
              <span>wishlink.me/{username}</span>
              <ExternalLink className="w-3 h-3 text-slate-muted" />
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <MyGiftReservations />
            <NotificationBell userId={user.id} />

            <div className="w-px h-5 bg-parchment hidden sm:block" />

            <form action="/auth/signout" method="post" className="hidden sm:block">
              <button
                type="submit"
                className="text-xs font-semibold text-slate-muted hover:text-ink transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>

        {/* Desktop Secondary Tab Bar */}
        <div className="border-t border-parchment/60 bg-cotton/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto py-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-ink hover:bg-parchment-light transition-colors shrink-0"
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Wishlist</span>
            </Link>

            <Link
              href="/dashboard/addresses"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-muted hover:text-ink hover:bg-parchment-light transition-colors shrink-0"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Shipping Addresses</span>
            </Link>

            <Link
              href="/dashboard/notifications"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-muted hover:text-ink hover:bg-parchment-light transition-colors shrink-0"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Gifting Requests</span>
            </Link>

            <Link
              href="/dashboard/security"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-muted hover:text-ink hover:bg-parchment-light transition-colors shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Security & 2FA</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-12">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-parchment px-4 py-2 flex items-center justify-around">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-[10px] font-semibold text-ink">
          <ListOrdered className="w-4 h-4" />
          <span>Wishlist</span>
        </Link>
        <Link href="/dashboard/addresses" className="flex flex-col items-center gap-1 text-[10px] font-medium text-slate-muted hover:text-ink">
          <MapPin className="w-4 h-4" />
          <span>Addresses</span>
        </Link>
        <Link href="/dashboard/notifications" className="flex flex-col items-center gap-1 text-[10px] font-medium text-slate-muted hover:text-ink">
          <Bell className="w-4 h-4" />
          <span>Requests</span>
        </Link>
        <Link href="/dashboard/security" className="flex flex-col items-center gap-1 text-[10px] font-medium text-slate-muted hover:text-ink">
          <ShieldCheck className="w-4 h-4" />
          <span>Security</span>
        </Link>
      </nav>
    </div>
  )
}
