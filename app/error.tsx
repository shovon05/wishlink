'use client'

import { useEffect, useState } from 'react'
import { parseAppError } from '@/lib/error-utils'
import Link from 'next/link'
import { 
  AlertOctagon, 
  RefreshCw, 
  Home, 
  Terminal, 
  Copy, 
  Check, 
  Database 
} from 'lucide-react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [showTechnical, setShowTechnical] = useState(false)

  const errorInfo = parseAppError(error)

  useEffect(() => {
    console.error('Wishlink Application Error:', error)
  }, [error])

  const handleCopy = async () => {
    const report = {
      title: errorInfo.title,
      message: error.message || errorInfo.message,
      digest: error.digest,
      code: errorInfo.code,
      stack: error.stack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: new Date().toISOString(),
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <main className="min-h-screen bg-cotton flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-blush/60 selection:text-ink">
      <div className="max-w-xl w-full paper-tag rounded-3xl p-6 sm:p-8 border border-parchment shadow-md space-y-6">
        {/* Header Icon & Badges */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-ribbon-light border border-ribbon/30 flex items-center justify-center text-ribbon shadow-2xs">
              {errorInfo.isDatabaseError ? (
                <Database className="w-6 h-6 stroke-[2.2]" />
              ) : (
                <AlertOctagon className="w-6 h-6 stroke-[2.2]" />
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-ribbon">
                {errorInfo.isDatabaseError ? 'Database Observability Alert' : 'System Notice'}
              </span>
              <h1 className="text-lg sm:text-xl font-serif font-bold text-ink">
                {errorInfo.title}
              </h1>
            </div>
          </div>

          {errorInfo.code && (
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-parchment-light border border-parchment text-mocha">
              ERR_{errorInfo.code}
            </span>
          )}
        </div>

        {/* User-friendly explanation */}
        <div className="p-4 rounded-2xl bg-parchment-light/40 border border-parchment space-y-2">
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            {error.message || errorInfo.message}
          </p>
          {errorInfo.suggestion && (
            <p className="text-xs text-mocha font-semibold">
              💡 {errorInfo.suggestion}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => reset()}
            className="posh-button-primary inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-semibold cursor-pointer shadow-xs min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-semibold bg-white border border-parchment text-ink hover:bg-parchment-light/50 transition-colors min-h-[44px] shadow-2xs"
          >
            <Home className="w-4 h-4 text-caramel" />
            <span>Return to Studio</span>
          </Link>
        </div>

        {/* Technical Diagnostics Accordion */}
        <div className="border-t border-parchment pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowTechnical(!showTechnical)}
              className="text-xs text-slate-muted hover:text-ink font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer py-1"
            >
              <Terminal className="w-3.5 h-3.5 text-caramel" />
              <span>{showTechnical ? 'Hide Technical Diagnostics' : 'Inspect Error Diagnostics'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="text-xs font-semibold text-slate-muted hover:text-mocha inline-flex items-center gap-1.5 transition-colors cursor-pointer py-1"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Report</span>
                </>
              )}
            </button>
          </div>

          {showTechnical && (
            <div className="rounded-2xl bg-white p-4 border border-parchment font-mono text-[11px] space-y-2 text-ink/80 overflow-x-auto max-h-56">
              {error.digest && (
                <div>
                  <strong className="text-ribbon">Digest:</strong> {error.digest}
                </div>
              )}
              {errorInfo.code && (
                <div>
                  <strong className="text-caramel">Code:</strong> {errorInfo.code}
                </div>
              )}
              {error.stack && (
                <div className="pt-2 border-t border-parchment/60 whitespace-pre text-[10px] leading-tight text-slate-muted">
                  {error.stack}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
