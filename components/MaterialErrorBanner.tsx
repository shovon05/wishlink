'use client'

import { useState } from 'react'
import { parseAppError, AppErrorInfo } from '@/lib/error-utils'
import { 
  Database, 
  ShieldAlert, 
  AlertCircle, 
  WifiOff, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  X,
  Terminal
} from 'lucide-react'

interface MaterialErrorBannerProps {
  error: unknown
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  fallbackMessage?: string
}

export default function MaterialErrorBanner({
  error,
  onRetry,
  onDismiss,
  className = '',
  fallbackMessage,
}: MaterialErrorBannerProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!error) return null

  const errorInfo: AppErrorInfo = parseAppError(error, fallbackMessage)

  const handleCopy = async () => {
    const payload = JSON.stringify(
      {
        title: errorInfo.title,
        message: errorInfo.message,
        code: errorInfo.code || null,
        hint: errorInfo.hint || null,
        details: errorInfo.details || null,
        isDatabaseError: errorInfo.isDatabaseError,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
    try {
      await navigator.clipboard.writeText(payload)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // Clipboard fallback
    }
  }

  // Select appropriate icon
  const renderIcon = () => {
    if (errorInfo.code === 'NETWORK_OFFLINE' || errorInfo.title.includes('Connection')) {
      return <WifiOff className="w-5 h-5 text-ribbon" />
    }
    if (errorInfo.isDatabaseError) {
      return <Database className="w-5 h-5 text-ribbon" />
    }
    if (errorInfo.code?.includes('AUTH') || errorInfo.code === '42501' || errorInfo.code?.includes('WEBAUTHN')) {
      return <ShieldAlert className="w-5 h-5 text-ribbon" />
    }
    return <AlertCircle className="w-5 h-5 text-ribbon" />
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`rounded-2xl border border-ribbon/30 bg-blush-light text-ink overflow-hidden transition-all shadow-xs ${className}`}
    >
      <div className="p-4 sm:p-5 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-ribbon/10 border border-ribbon/20 flex items-center justify-center shrink-0 mt-0.5">
          {renderIcon()}
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-serif font-bold text-ink tracking-tight">
                {errorInfo.title}
              </h3>
              {errorInfo.code && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-ribbon/15 text-ribbon border border-ribbon/20">
                  Code: {errorInfo.code}
                </span>
              )}
              {errorInfo.isDatabaseError && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-mocha/10 text-mocha border border-mocha/20">
                  Database / Supabase
                </span>
              )}
            </div>

            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-muted hover:text-ink hover:bg-ribbon/10 transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="text-xs text-ink-muted leading-relaxed">
            {errorInfo.message}
          </p>

          {errorInfo.suggestion && (
            <p className="text-[11px] text-mocha font-medium pt-0.5">
              💡 {errorInfo.suggestion}
            </p>
          )}

          {/* Action Row */}
          <div className="flex items-center flex-wrap gap-2.5 pt-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ink text-cotton text-xs font-semibold hover:bg-ink/90 active:scale-95 transition-all cursor-pointer min-h-[36px] shadow-2xs"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Action</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/70 hover:bg-white text-slate-muted hover:text-ink text-xs font-semibold border border-ribbon/20 transition-all cursor-pointer min-h-[36px]"
            >
              <Terminal className="w-3 h-3 text-caramel" />
              <span>{showDetails ? 'Hide Diagnostics' : 'View Diagnostics'}</span>
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/70 hover:bg-white text-slate-muted hover:text-ink text-xs font-semibold border border-ribbon/20 transition-all cursor-pointer min-h-[36px]"
              title="Copy full technical details for debugging"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-muted" />
                  <span>Copy Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Diagnostics Drawer */}
      {showDetails && (
        <div className="border-t border-ribbon/20 bg-white/90 p-3.5 sm:p-4 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-muted font-sans border-b border-parchment pb-1.5">
            <span className="font-semibold">Technical Error Stack & Diagnostics</span>
            <span>UTF-8 Diagnostics</span>
          </div>

          <div className="space-y-1 text-[11px] leading-relaxed text-ink/80 overflow-x-auto max-h-48 p-2.5 rounded-lg bg-cotton/70 border border-parchment/60 whitespace-pre-wrap">
            {errorInfo.code && <div><strong className="text-ribbon">code:</strong> {errorInfo.code}</div>}
            {errorInfo.hint && <div><strong className="text-caramel">hint:</strong> {errorInfo.hint}</div>}
            {errorInfo.details && <div><strong className="text-mocha">details:</strong> {errorInfo.details}</div>}
            <div><strong className="text-ink">timestamp:</strong> {new Date().toISOString()}</div>
          </div>
        </div>
      )}
    </div>
  )
}
