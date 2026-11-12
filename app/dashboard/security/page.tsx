'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import TotpSetup from '@/components/TotpSetup'
import { KeyRound, Plus, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface PasskeyRecord {
  id: string
  friendly_name?: string
  created_at: string
}

export default function SecurityPage() {
  const supabase = createClient()
  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchPasskeys = useCallback(async () => {
    try {
      const { data } = await supabase.auth.passkey.list()
      if (data) setPasskeys(data as unknown as PasskeyRecord[])
    } catch {
      // Passkey list retrieval fallback
    }
  }, [supabase])

  useEffect(() => {
    let ignore = false
    const init = async () => {
      try {
        const { data } = await supabase.auth.passkey.list()
        if (!ignore && data) {
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
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)

    try {
      if (!window.PublicKeyCredential) {
        throw new Error('Your browser or hardware does not support Passkey registration.')
      }

      const { error } = await supabase.auth.registerPasskey()

      if (error) {
        if (error.message.toLowerCase().includes('cancel') || error.message.includes('NotAllowedError')) {
          throw new Error('Passkey creation prompt was cancelled.')
        }
        throw new Error('Failed to register Passkey. Please try again.')
      }

      setSuccessMsg('New Passkey enrolled successfully.')
      fetchPasskeys()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during passkey enrollment.'
      setErrorMsg(message)
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePasskey = async (id: string) => {
    if (!confirm('Remove this passkey from your account?')) return
    setLoading(true)
    setErrorMsg('')

    try {
      const { error } = await supabase.auth.passkey.delete({ passkeyId: id })
      if (error) throw new Error('Failed to remove passkey.')

      setSuccessMsg('Passkey removed successfully.')
      fetchPasskeys()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred while removing the passkey.'
      setErrorMsg(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">

      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink tracking-tight">
          Security & Credentials
        </h1>
        <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
          Manage hardware passkeys, biometric authentication, and multi-factor security.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-ribbon-light border border-ribbon/30 text-ribbon text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-spruce-light border border-spruce/30 text-spruce text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. Passkey Section */}
      <div className="paper-tag rounded-3xl p-6 sm:p-7 space-y-5 bg-white border border-parchment">
        <div>
          <h2 className="text-base font-serif font-bold text-ink flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-caramel stroke-[2.2]" />
            <span>Biometric Passkeys (Passwordless)</span>
          </h2>
          <p className="text-xs text-slate-muted mt-0.5 leading-relaxed">
            Use Touch ID, Face ID, Windows Hello, or a YubiKey to sign in instantly without typing a password.
          </p>
        </div>

        <div>
          <button
            onClick={handleAddPasskey}
            disabled={loading}
            type="button"
            className="posh-button-primary inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Enrolling Passkey...</span>
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
            Enrolled Hardware & Biometric Keys
          </span>

          {passkeys.length === 0 ? (
            <p className="text-xs text-slate-muted bg-parchment-light/40 p-4 rounded-2xl border border-parchment">
              No passkeys enrolled on this account yet. Add one above for instant, passwordless sign-in.
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
                      {pk.friendly_name || 'Biometric Credential'}
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
