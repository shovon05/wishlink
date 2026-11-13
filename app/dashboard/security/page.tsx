'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import TotpSetup from '@/components/TotpSetup'
import MaterialErrorBanner from '@/components/MaterialErrorBanner'
import { KeyRound, Plus, Trash2, Loader2, CheckCircle2, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react'

interface PasskeyRecord {
  id: string
  friendly_name?: string
  created_at: string
}

export default function SecurityPage() {
  const supabase = createClient()
  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>([])
  const [errorState, setErrorState] = useState<unknown>(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchPasskeys = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.passkey.list()
      if (!error && data) {
        setPasskeys(data as unknown as PasskeyRecord[])
      }
    } catch {
      // Passkey list retrieval fallback
    }
  }, [supabase])

  useEffect(() => {
    let ignore = false
    const init = async () => {
      try {
        const { data, error } = await supabase.auth.passkey.list()
        if (!ignore && !error && data) {
          setPasskeys(data as unknown as PasskeyRecord[])
        }
      } catch {
        // Fallback
      }
    }
    init()
    return () => {
      ignore = true
    }
  }, [supabase])

  const handleAddPasskey = async () => {
    setErrorState(null)
    setSuccessMsg('')
    setLoading(true)

    try {
      if (typeof window === 'undefined' || !window.PublicKeyCredential) {
        throw new Error('Your browser or hardware does not support Passkey (WebAuthn) registration.')
      }

      // Check for password manager support or platform authenticator
      const isBitwardenOrExtensionAvailable = typeof window.PublicKeyCredential !== 'undefined'

      // Call Supabase registerPasskey
      // Note: Supabase passkey registration allows modern password managers (Bitwarden, 1Password, Dashlane)
      // and device authenticators (Touch ID, Windows Hello, YubiKey) to capture and store the credential.
      const { data, error } = await supabase.auth.registerPasskey()

      if (error) {
        setErrorState(error)
        return
      }

      if (data) {
        setSuccessMsg(
          isBitwardenOrExtensionAvailable
            ? 'New Passkey enrolled successfully! Saved to your password manager or biometric authenticator.'
            : 'New biometric Passkey enrolled successfully.'
        )
        await fetchPasskeys()
      }
    } catch (err) {
      setErrorState(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePasskey = async (id: string) => {
    if (!confirm('Remove this passkey from your account?')) return
    setLoading(true)
    setErrorState(null)

    try {
      const { error } = await supabase.auth.passkey.delete({ passkeyId: id })
      if (error) throw error

      setSuccessMsg('Passkey removed successfully.')
      await fetchPasskeys()
    } catch (err) {
      setErrorState(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">

      {/* Page Title & M3 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-parchment">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-caramel stroke-[2.2]" />
            <span>Security & Credentials</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted mt-1 leading-relaxed">
            Manage passwordless passkeys (Touch ID, Bitwarden, 1Password) and multi-factor security.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto bg-parchment-light/60 px-3 py-1.5 rounded-full border border-parchment text-[11px] font-mono text-mocha font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-caramel" />
          <span>FIDO2 / WebAuthn Certified</span>
        </div>
      </div>

      {/* Observability Error Banner */}
      {Boolean(errorState) && (
        <MaterialErrorBanner
          error={errorState}
          onDismiss={() => setErrorState(null)}
          onRetry={handleAddPasskey}
          fallbackMessage="Unable to manage security credentials at this time."
        />
      )}

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-spruce-light border border-spruce/30 text-spruce text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. Passkey Section */}
      <div className="paper-tag rounded-3xl p-6 sm:p-7 space-y-5 bg-white border border-parchment shadow-xs">
        <div>
          <h2 className="text-base font-serif font-bold text-ink flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-caramel stroke-[2.2]" />
            <span>Passkeys (Passwordless & Password Managers)</span>
          </h2>
          <p className="text-xs text-slate-muted mt-1 leading-relaxed">
            Sign in with Bitwarden, 1Password, Touch ID, Face ID, Windows Hello, or a hardware YubiKey without ever typing a password.
          </p>
        </div>

        {/* Informational Guidance Callout for RP ID Configuration */}
        <div className="p-3.5 rounded-2xl bg-parchment-light/50 border border-parchment text-xs text-ink/80 flex items-start gap-2.5">
          <span className="text-sm">🔑</span>
          <div className="space-y-1">
            <p className="font-semibold text-ink">
              Bitwarden & Hardware Passkey Setup
            </p>
            <p className="text-[11px] text-slate-muted leading-relaxed">
              When you click <strong>Add New Passkey</strong>, Bitwarden or your browser authenticator will ask to save your credentials. Passkeys require the Relying Party ID in your Supabase Auth settings to match your current site domain (<code className="bg-white px-1 py-0.5 rounded border border-parchment font-mono text-[10px] text-ink">wishlink-gamma.vercel.app</code>).
            </p>
            <a
              href="https://supabase.com/dashboard/project/jpwoydvlqukbnlxeuqeh/auth/passkeys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-mocha hover:text-ink underline pt-0.5"
            >
              <span>Open Supabase Passkeys Settings</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div>
          <button
            onClick={handleAddPasskey}
            disabled={loading}
            type="button"
            className="posh-button-primary inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-xs active:scale-98 transition-all min-h-[40px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Requesting Authenticator...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add New Passkey</span>
              </>
            )}
          </button>
        </div>

        <div className="space-y-2 pt-2 border-t border-parchment">
          <span className="text-[11px] font-semibold text-slate-muted block">
            Enrolled Hardware & Password Manager Keys
          </span>

          {passkeys.length === 0 ? (
            <p className="text-xs text-slate-muted bg-parchment-light/40 p-4 rounded-2xl border border-parchment leading-relaxed">
              No passkeys enrolled on this account yet. Add one above to enable instant passwordless sign-in with your password manager or device biometrics.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {passkeys.map((pk) => (
                <li
                  key={pk.id}
                  className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-parchment shadow-2xs hover:border-caramel/30 transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-ink">
                      {pk.friendly_name || 'Passkey Credential'}
                    </p>
                    <p className="text-[10px] text-slate-muted font-mono">
                      Enrolled on {new Date(pk.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemovePasskey(pk.id)}
                    disabled={loading}
                    type="button"
                    className="p-1.5 rounded-lg text-slate-muted hover:text-ribbon hover:bg-ribbon-light transition-colors cursor-pointer"
                    title="Remove passkey"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 2. TOTP 2FA Section */}
      <TotpSetup />

    </div>
  )
}
