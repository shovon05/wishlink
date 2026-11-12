import Link from 'next/link'
import { PackageOpen, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-cotton flex flex-col items-center justify-center p-4">
      <div className="paper-tag rounded-3xl p-8 sm:p-10 max-w-md w-full text-center space-y-5">
        <div className="w-14 h-14 bg-parchment-light rounded-2xl flex items-center justify-center mx-auto text-slate-muted border border-parchment">
          <PackageOpen className="w-7 h-7 stroke-1" />
        </div>
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-muted uppercase tracking-wider block">
            404 Not Found
          </span>
          <h1 className="text-2xl font-serif font-bold text-ink">
            Page doesn&apos;t exist
          </h1>
          <p className="text-xs text-slate-muted leading-relaxed">
            The link you followed may have expired, or this registry handle has moved.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-ink text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-ink/90 transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Wishlink</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
