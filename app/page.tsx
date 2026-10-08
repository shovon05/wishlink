import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const steps = [
    { n: '1', title: 'Add what you wish for', text: 'Paste any product link. We pull in the name, photo and price for you.' },
    { n: '2', title: 'Share one short link', text: 'Put your wishlink in your Instagram, Facebook or X bio. No account needed to view it.' },
    { n: '3', title: 'Receive gifts privately', text: 'Friends reserve an item, you choose which address to share. Nobody sees it by default.' },
  ]

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24 text-center">
        <p className="text-5xl mb-6">🎁</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
          One link for everything you wish for
        </h1>
        <p className="mt-5 text-lg text-gray-600 max-w-xl mx-auto">
          Build a minimal wishlist, drop the link in your bio, and let people gift you the things you actually want.
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            href={user ? '/dashboard' : '/login'}
            className="bg-black text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
          >
            {user ? 'Go to my dashboard' : 'Get started — it’s free'}
          </Link>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3 text-left">
          {steps.map((s) => (
            <div key={s.n} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-black text-white text-sm font-bold flex items-center justify-center mb-3">
                {s.n}
              </div>
              <h2 className="font-semibold text-gray-900 mb-1">{s.title}</h2>
              <p className="text-sm text-gray-500">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
