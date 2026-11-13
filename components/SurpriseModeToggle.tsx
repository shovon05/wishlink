'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import MaterialErrorBanner from '@/components/MaterialErrorBanner'

interface Props {
  userId: string
  initialSurpriseMode: boolean
}

export default function SurpriseModeToggle({ userId, initialSurpriseMode }: Props) {
  const [surpriseMode, setSurpriseMode] = useState(initialSurpriseMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleToggle = async () => {
    const nextVal = !surpriseMode
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ surprise_mode: nextVal })
        .eq('id', userId)

      if (updateError) {
        setError(updateError)
        return
      }

      setSurpriseMode(nextVal)
      router.refresh()
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          disabled={loading}
          type="button"
          title="Toggle surprise mode to hide which gifts are reserved"
          aria-label="Toggle surprise mode"
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer min-h-[38px] ${
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

      {Boolean(error) && (
        <div className="pt-1 max-w-sm">
          <MaterialErrorBanner
            error={error}
            onDismiss={() => setError(null)}
            fallbackMessage="Failed to update spoiler settings."
          />
        </div>
      )}
    </div>
  )
}
