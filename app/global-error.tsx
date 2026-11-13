'use client'

import { useEffect, useState } from 'react'
import { parseAppError } from '@/lib/error-utils'
import { AlertOctagon, RefreshCw, Copy, Check, Database } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [copied, setCopied] = useState(false)
  const errorInfo = parseAppError(error)

  useEffect(() => {
    console.error('Wishlink Root Level Error:', error)
  }, [error])

  const handleCopy = async () => {
    const report = {
      title: errorInfo.title,
      message: error.message || errorInfo.message,
      digest: error.digest,
      code: errorInfo.code,
      stack: error.stack,
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
    <html lang="en">
      <body style={{ backgroundColor: '#FAF2E9', color: '#2C1B10', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ maxWidth: '32rem', width: '100%', backgroundColor: '#ffffff', borderRadius: '1.5rem', padding: '2rem', border: '1px solid #EAD9C4', boxShadow: '0 4px 14px -2px rgba(44, 27, 16, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '1rem', backgroundColor: '#FDF3F4', border: '1px solid rgba(217, 111, 121, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D96F79' }}>
                {errorInfo.isDatabaseError ? <Database style={{ width: '1.5rem', height: '1.5rem' }} /> : <AlertOctagon style={{ width: '1.5rem', height: '1.5rem' }} />}
              </div>
              <div>
                <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', color: '#D96F79' }}>
                  {errorInfo.isDatabaseError ? 'Database System Exception' : 'Application Exception'}
                </span>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0.25rem 0 0 0' }}>
                  {errorInfo.title}
                </h1>
              </div>
            </div>

            <div style={{ padding: '1rem', borderRadius: '1rem', backgroundColor: '#F4E8D8', border: '1px solid #EAD9C4', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
                {error.message || errorInfo.message}
              </p>
              {errorInfo.suggestion && (
                <p style={{ fontSize: '0.75rem', color: '#8A5E3B', fontWeight: '600', marginTop: '0.5rem', marginBottom: 0 }}>
                  💡 {errorInfo.suggestion}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => reset()}
                style={{
                  flex: '1',
                  minHeight: '2.75rem',
                  backgroundColor: '#8A5E3B',
                  color: '#FAF2E9',
                  border: 'none',
                  borderRadius: '0.875rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <RefreshCw style={{ width: '1rem', height: '1rem' }} />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                style={{
                  minHeight: '2.75rem',
                  backgroundColor: '#ffffff',
                  color: '#5E4331',
                  border: '1px solid #EAD9C4',
                  borderRadius: '0.875rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '0 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                {copied ? <Check style={{ width: '0.875rem', height: '0.875rem', color: '#059669' }} /> : <Copy style={{ width: '0.875rem', height: '0.875rem' }} />}
                <span>{copied ? 'Copied' : 'Copy Report'}</span>
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
