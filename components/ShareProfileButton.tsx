'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ShareProfileButtonProps {
  profileId: string
  username: string
}

export default function ShareProfileButton({ profileId, username }: ShareProfileButtonProps) {
  const [isOwner, setIsOwner] = useState(false)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkOwnership = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.id === profileId) {
        setIsOwner(true)
      }
    }
    checkOwnership()
  }, [profileId, supabase])

  // মালিক না হলে কিছুই রেন্ডার করবে না
  if (!isOwner) return null

  const handleShare = async () => {
    try {
      const profileUrl = `${window.location.origin}/${username}`
      await navigator.clipboard.writeText(profileUrl)

      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <button
      onClick={handleShare}
      className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
        copied
          ? 'bg-green-100 text-green-700 border border-green-200'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
      }`}
    >
      {copied ? '✓ Link copied!' : 'Share My Profile'}
    </button>
  )
}
