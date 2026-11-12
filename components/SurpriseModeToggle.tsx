'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

interface Props {
  userId: string
  initialSurpriseMode: boolean
}

export default function SurpriseModeToggle({ userId, initialSurpriseMode }: Props) {
  const [surpriseMode, setSurpriseMode] = useState(initialSurpriseMode)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleToggle = async () => {
    const nextVal = !surpriseMode
    setLoading(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ surprise_mode: nextVal })
        .eq('id', userId)

      if (!error) {
        setSurpriseMode(nextVal)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleToggle}
        disabled={loading}
        type="button"
        title="Toggle surprise mode to hide which gifts are reserved"
        aria-label="Toggle surprise mode"
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
          surpriseMode
            ? 'bg-caramel-light text-caramel border-caramel/40 shadow-2xs'
            : 'bg-white text-slate-muted border-parchment hover:border-caramel/40 hover:text-ink shadow-2xs'
        }`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : surpriseMode ? (
          <EyeOff className="w-3.5 h-3.5 text-caramel" />
        ) : (
          <Eye className="w-3.5 h-3.5 text-slate-muted" />
        )}
        <span>Spoiler Mode: {surpriseMode ? 'Active' : 'Off'}</span>
      </button>
    </div>
  )
}
