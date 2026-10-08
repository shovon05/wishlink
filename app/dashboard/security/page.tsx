'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TotpSetup from '@/components/TotpSetup' // 2FA কম্পোনেন্ট ইম্পোর্ট করা হলো

export default function SecurityPage() {
  const supabase = createClient()
  const [passkeys, setPasskeys] = useState<any[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPasskeys()
  }, [])

  const fetchPasskeys = async () => {
    const { data } = await supabase.auth.passkey.list()
    if (data) setPasskeys(data)
  }

  const handleAddPasskey = async () => {
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)

    try {
      if (!window.PublicKeyCredential) {
        throw new Error('আপনার ডিভাইস বা ব্রাউজার Passkey সাপোর্ট করে না।')
      }

      const { data, error } = await supabase.auth.registerPasskey()

      if (error) {
        if (error.message.toLowerCase().includes('cancel') || error.message.includes('NotAllowedError')) {
          throw new Error('আপনি Passkey প্রসেসটি বাতিল করেছেন।')
        }
        throw new Error('Passkey যোগ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।')
      }

      setSuccessMsg('সফলভাবে নতুন Passkey যুক্ত হয়েছে!')
      fetchPasskeys()
    } catch (err: any) {
      setErrorMsg(err.message || 'নেটওয়ার্ক বা অজানা কোনো সমস্যা হয়েছে।')
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePasskey = async (id: string) => {
    setLoading(true)
    setErrorMsg('')

    try {
      const { error } = await supabase.auth.passkey.delete({ passkeyId: id })
      if (error) throw new Error('Passkey মুছতে ব্যর্থ হয়েছে।')

      setSuccessMsg('Passkey সফলভাবে মুছে ফেলা হয়েছে।')
      fetchPasskeys()
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account security, passkeys, and two-factor authentication.</p>
      </div>

      {/* 1. Passkey Section */}
      <div className="p-6 md:p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Passkeys (Passwordless Login)</h2>
        <p className="text-gray-500 mb-6 text-sm">
          Use your fingerprint, face scan, or screen lock to sign in securely without a password.
        </p>

        {errorMsg && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 font-medium">{errorMsg}</div>}
        {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6 font-medium">{successMsg}</div>}

        <div className="mb-8">
          <button
            onClick={handleAddPasskey}
            disabled={loading}
            className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Processing...' : 'Add a Passkey'}
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Your Saved Passkeys</h3>
          {passkeys.length === 0 ? (
            <p className="text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100">কোনো Passkey যুক্ত করা নেই।</p>
          ) : (
            <ul className="space-y-3">
              {passkeys.map((pk) => (
                <li key={pk.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div>
                    <p className="font-semibold text-gray-900">{pk.friendly_name || 'Unknown Device'}</p>
                    <p className="text-xs text-gray-500 mt-1">Created: {new Date(pk.created_at).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => handleRemovePasskey(pk.id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-800 text-sm font-semibold disabled:opacity-50 px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
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
