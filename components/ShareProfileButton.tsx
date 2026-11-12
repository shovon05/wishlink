'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

interface ShareProfileButtonProps {
  profileId?: string
  username: string
  petName?: string
}

export default function ShareProfileButton({ username, petName }: ShareProfileButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/${username}` : `/${username}`
    const shareTitle = `${petName || username}'s Wishlist on Wishlink`
    const shareText = `Check out what ${petName || username} is wishing for on Wishlink:`

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: profileUrl,
        })
        return
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // Fallback
    }
  }

  return (
    <button
      onClick={handleShare}
      type="button"
      aria-label="Share this registry"
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer shadow-2xs ${
        copied
          ? 'bg-spruce-light text-spruce border border-spruce/30'
          : 'bg-white text-ink border border-parchment hover:border-caramel/40 hover:bg-parchment-light/60 active:scale-98'
      }`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-spruce stroke-[2.5]" />
          <span>Link copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5 text-caramel stroke-[2]" />
          <span>Share Registry</span>
        </>
      )}
    </button>
  )
}
