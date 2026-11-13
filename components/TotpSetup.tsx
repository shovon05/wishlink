'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import MaterialErrorBanner from '@/components/MaterialErrorBanner'
import { Copy, CheckCircle2, ShieldCheck, Check, KeyRound, Loader2 } from 'lucide-react'

export default function TotpSetup() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [factorId, setFactorId] = useState('')

  // Setup states
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verifyCode, setVerifyCode] = useState('')

  // UI states
  const [errorState, setErrorState] = useState<unknown>(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let ignore = false
    const init = async () => {
      try {
        const { data } = await supabase.auth.mfa.listFactors()
        if (!ignore && data && data.totp.length > 0) {
          const verifiedFactor = data.totp.find(f => f.status === 'verified')
          if (verifiedFactor) {
            setIsEnrolled(true)
            setFactorId(verifiedFactor.id)
          }
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    init()
    return () => {
      ignore = true
    }
  }, [supabase])

  const handleEnable = async () => {
    setActionLoading(true)
    setErrorState(null)
    try {
      const { data: existing } = await supabase.auth.mfa.listFactors()
      for (const f of existing?.all ?? []) {
        if (f.factor_type === 'totp' && f.status === 'unverified') {
          await supabase.auth.mfa.unenroll({ factorId: f.id })
        }
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
      if (enrollError) throw enrollError

      if (data) {
        setFactorId(data.id)
        setQrCode(data.totp.qr_code)
        setSecret(data.totp.secret)
      }
    } catch (err) {
      setErrorState(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      setErrorState('Please enter a 6-digit verification code.')
      return
    }

    setActionLoading(true)
    setErrorState(null)
    setSuccessMsg('')

    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId })
      if (challenge.error) throw challenge.error

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode
      })

      if (verify.error) throw verify.error

      setIsEnrolled(true)
      setSuccessMsg('Two-Factor Authentication successfully enabled.')
      setQrCode('')
      setSecret('')
      setVerifyCode('')
    } catch (err) {
      setErrorState(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDisable = async () => {
    if (!window.confirm('Are you sure you want to disable Two-Factor Authentication?')) return
    setActionLoading(true)
    setErrorState(null)

    try {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId })
      if (unenrollError) throw unenrollError

      setIsEnrolled(false)
      setFactorId('')
      setSuccessMsg('Two-Factor Authentication has been disabled.')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setErrorState(err)
    } finally {
      setActionLoading(false)
    }
  }

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  if (loading) {
    return (
      <div className="paper-tag rounded-3xl p-6 text-xs text-slate-muted bg-white border border-parchment">
        Checking Two-Factor Authentication status...
      </div>
    )
  }

  return (
    <div className="paper-tag rounded-3xl p-6 sm:p-7 space-y-5 bg-white border border-parchment">
      <div>
        <h2 className="text-base font-serif font-bold text-ink flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-caramel stroke-[2.2]" />
          <span>Authenticator App (TOTP 2FA)</span>
        </h2>
        <p className="text-xs text-slate-muted mt-0.5 leading-relaxed">
          Protect your registry and delivery addresses with time-based one-time codes from Google Authenticator, 1Password, or Authy.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-spruce-light border border-spruce/30 text-spruce text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {Boolean(errorState) && (
        <MaterialErrorBanner
          error={errorState}
          onDismiss={() => setErrorState(null)}
          onRetry={qrCode ? handleVerify : handleEnable}
          fallbackMessage="Authenticator operation could not be completed."
        />
      )}

      {isEnrolled ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-spruce-light border border-spruce/30 rounded-2xl gap-3">
          <span className="font-semibold text-xs text-spruce flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-spruce" />
            <span>2FA Protection Active</span>
          </span>
          <button
            onClick={handleDisable}
            disabled={actionLoading}
            type="button"
            className="px-4 py-2 bg-white text-ribbon border border-ribbon/30 rounded-xl text-xs font-semibold hover:bg-ribbon-light transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto"
          >
            {actionLoading ? 'Disabling...' : 'Disable 2FA'}
          </button>
        </div>
      ) : qrCode ? (
        <div className="flex flex-col items-center max-w-sm mx-auto p-6 bg-parchment-light/40 border border-parchment rounded-2xl space-y-4">
          <h3 className="text-sm font-serif font-bold text-ink text-center">
            Scan with Authenticator
          </h3>

          {/* High-fidelity SVG QR Code Container */}
          <div className="w-[190px] h-[190px] bg-white p-3 rounded-2xl border border-parchment shadow-xs flex items-center justify-center overflow-hidden">
            {qrCode.startsWith('data:') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrCode}
                alt="Authenticator QR Code"
                className="w-[166px] h-[166px] object-contain"
              />
            ) : qrCode.startsWith('<svg') ? (
              <div
                className="w-[166px] h-[166px] flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: qrCode }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:image/svg+xml;utf-8,${encodeURIComponent(qrCode)}`}
                alt="Authenticator QR Code"
                className="w-[166px] h-[166px] object-contain"
              />
            )}
          </div>

          <div className="w-full space-y-1">
            <span className="text-[10px] font-semibold text-slate-muted uppercase tracking-wider block">
              Manual Setup Key
            </span>
            <div className="flex items-center gap-2 bg-white border border-parchment p-2 rounded-xl">
              <code className="flex-1 text-xs text-ink font-mono break-all">{secret}</code>
              <button
                onClick={copySecret}
                type="button"
                className="p-1.5 text-slate-muted hover:text-ink bg-parchment-light rounded-lg transition-colors cursor-pointer"
                title="Copy secret key"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-spruce" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="w-full space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 text-center">
                Enter 6-digit confirmation code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="000000"
                className="w-full text-center text-2xl font-mono tracking-[0.3em] py-2.5 border border-parchment rounded-xl bg-white text-ink focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel shadow-2xs"
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={actionLoading || verifyCode.length !== 6}
              type="button"
              className="posh-button-primary w-full py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-40"
            >
              {actionLoading ? 'Verifying...' : 'Verify & Activate 2FA'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={handleEnable}
            disabled={actionLoading}
            type="button"
            className="posh-button-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {actionLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating QR Key...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5 stroke-[2.2] text-blush" />
                <span>Enable Authenticator 2FA</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
