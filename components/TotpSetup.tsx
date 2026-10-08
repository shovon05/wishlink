'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Copy, CheckCircle2 } from 'lucide-react' // Lucide আইকন ইনস্টল করা না থাকলে শুধু টেক্সট ব্যবহার করতে পারেন

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
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    checkFactors()
  }, [])

  const checkFactors = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (data && data.totp.length > 0) {
      const verifiedFactor = data.totp.find(f => f.status === 'verified')
      if (verifiedFactor) {
        setIsEnrolled(true)
        setFactorId(verifiedFactor.id)
      }
    }
    setLoading(false)
  }

  const handleEnable = async () => {
    setActionLoading(true)
    setError('')
    // আগের অসম্পূর্ণ (unverified) factor থাকলে মুছে ফেলা, নাহলে enroll এরর দেয়
    const { data: existing } = await supabase.auth.mfa.listFactors()
    for (const f of existing?.all ?? []) {
      if (f.factor_type === 'totp' && f.status === 'unverified') {
        await supabase.auth.mfa.unenroll({ factorId: f.id })
      }
    }
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (error) {
      setError('Failed to initialize 2FA. Try again.')
    } else if (data) {
      setFactorId(data.id)
      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)
    }
    setActionLoading(false)
  }

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      setError('Please enter a 6-digit code.')
      return
    }

    setActionLoading(true)
    setError('')
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
      setSuccessMsg('2FA is enabled ✓')
      setQrCode('')
      setSecret('')
      setVerifyCode('')
    } catch (err: any) {
      setError('Incorrect code, please try again')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDisable = async () => {
    if (!window.confirm('Are you sure you want to disable Two-Factor Authentication?')) return
    setActionLoading(true)
    setError('')

    const { error } = await supabase.auth.mfa.unenroll({ factorId })
    if (!error) {
      setIsEnrolled(false)
      setFactorId('')
      setSuccessMsg('2FA has been disabled.')
      setTimeout(() => setSuccessMsg(''), 3000)
    } else {
      setError('Failed to disable 2FA.')
    }
    setActionLoading(false)
  }

  const copySecret = () => {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return <div className="p-6 bg-white border rounded-xl">Loading 2FA status...</div>
  }

  return (
    <div className="p-6 md:p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Two-Factor Authentication (Authenticator App)</h2>
      <p className="text-gray-500 mb-6 text-sm">
        Add an extra layer of security to your account using a TOTP app like Google Authenticator or Authy.
      </p>

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 size={20} /> {successMsg}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium">
          {error}
        </div>
      )}

      {isEnrolled ? (
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <span className="font-semibold text-green-600 flex items-center gap-2 mb-3 sm:mb-0">
            <CheckCircle2 size={20} /> 2FA is Active
          </span>
          <button
            onClick={handleDisable}
            disabled={actionLoading}
            className="px-5 py-2.5 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {actionLoading ? 'Disabling...' : 'Disable 2FA'}
          </button>
        </div>
      ) : qrCode ? (
        <div className="flex flex-col items-center max-w-sm mx-auto p-6 bg-gray-50 border border-gray-200 rounded-xl">
          <h3 className="font-bold text-gray-800 mb-4 text-center">Scan this QR Code</h3>

          <div
            className="w-[200px] h-[200px] bg-white p-2 rounded-lg shadow-sm mb-6"
            dangerouslySetInnerHTML={{ __html: qrCode }}
          />

          <div className="w-full mb-6">
            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Manual Entry Code</p>
            <div className="flex items-center gap-2 bg-white border border-gray-200 p-2 rounded-lg">
              <code className="flex-1 text-sm text-gray-800 break-all">{secret}</code>
              <button onClick={copySecret} className="p-2 text-gray-500 hover:text-black bg-gray-100 rounded-md">
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">Enter 6-digit code</label>
            <input
              type="text"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="000000"
              className="w-full text-center text-3xl tracking-[0.5em] py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
            />
            <button
              onClick={handleVerify}
              disabled={actionLoading || verifyCode.length !== 6}
              className="w-full bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleEnable}
          disabled={actionLoading}
          className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {actionLoading ? 'Loading...' : 'Enable 2FA'}
        </button>
      )}
    </div>
  )
}
