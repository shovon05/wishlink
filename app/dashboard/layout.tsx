import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NotificationBell from '@/components/NotificationBell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
  if (!profile || profile.username?.startsWith('user_')) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 shrink-0">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
          <div className="md:hidden">
            <NotificationBell userId={user.id} />
          </div>
        </div>
        <nav className="p-4 flex flex-col gap-2">
          <Link href="/dashboard" className="px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-blue-50 hover:text-blue-700 transition">My Wishlist</Link>
          <Link href="/dashboard/addresses" className="px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-blue-50 hover:text-blue-700 transition">Addresses</Link>
          <Link href="/dashboard/notifications" className="px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-blue-50 hover:text-blue-700 transition hidden md:block">Notifications</Link>
          <Link href="/dashboard/security" className="px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-blue-50 hover:text-blue-700 transition">Security (Passkey)</Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-end hidden md:flex shrink-0">
          <NotificationBell userId={user.id} />
          <div className="w-px h-6 bg-gray-300 mx-4" />
          <form action="/auth/signout" method="post">
            <button className="text-sm font-semibold text-gray-600 hover:text-black">Sign Out</button>
          </form>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
