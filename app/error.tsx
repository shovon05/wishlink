'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen bg-cotton flex flex-col items-center justify-center p-4">
      <div className="paper-tag p-8 rounded-3xl max-w-md w-full text-center space-y-5">
        <div className="w-14 h-14 bg-ribbon-light text-ribbon rounded-2xl flex items-center justify-center mx-auto border border-ribbon/20">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-serif font-bold text-ink">Something went wrong</h2>
          <p className="text-xs text-slate-muted leading-relaxed">
            We encountered an unexpected error while rendering this page. You can try refreshing.
          </p>
        </div>
        <button
          onClick={() => reset()}
          type="button"
          className="w-full inline-flex items-center justify-center gap-2 bg-ink text-white px-5 py-3 rounded-xl text-xs font-semibold hover:bg-ink/90 transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try again</span>
        </button>
      </div>
    </main>
  )
}
