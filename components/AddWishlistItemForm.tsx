'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Plus, Link2, Sparkles, Loader2, PackageOpen } from 'lucide-react'

const CATEGORIES = ['All Gifts', 'Kitchenware', 'Home & Bedding', 'Books', 'Audio & Tech', 'Style', 'Experiences', 'Other']

export default function AddWishlistItemForm({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<{ title: string; image: string; price: string; category: string } | null>(null)

  const fetchDetails = async () => {
    const sanitizedUrl = url.trim()
    if (!sanitizedUrl) return
    setLoading(true)
    try {
      const res = await fetch('/api/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sanitizedUrl }),
      })
      const data = await res.json()

      setPreview({
        title: data.title || '',
        image: data.image || '',
        price: '',
        category: 'All Gifts',
      })
    } catch {
      setPreview({ title: '', image: '', price: '', category: 'Other' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!preview || !url) return

    const sanitizedUrl = url.trim()
    const sanitizedTitle = preview.title.trim().substring(0, 250)
    const sanitizedPrice = preview.price.trim().substring(0, 50)

    if (!sanitizedUrl) return

    setSaving(true)
    try {
      const { data: maxItem } = await supabase
        .from('wishlist_items')
        .select('sort_order')
        .eq('user_id', userId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()

      const nextSortOrder = maxItem ? maxItem.sort_order + 1 : 0

      await supabase.from('wishlist_items').insert({
        user_id: userId,
        product_url: sanitizedUrl,
        title: sanitizedTitle || 'Untitled Wishlist Item',
        image_url: preview.image.trim(),
        price: sanitizedPrice,
        category: preview.category,
        sort_order: nextSortOrder,
      })

      setUrl('')
      setPreview(null)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-serif font-bold text-ink">
            Add Wishlist Item
          </h2>
          <p className="text-xs text-slate-muted">
            Paste any link from the web to automatically extract photo and product details.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <input
            type="url"
            maxLength={1000}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste product URL (e.g. https://...)"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-parchment text-sm bg-white text-ink placeholder:text-slate-muted/60 focus:outline-none focus:border-ink shadow-2xs transition-colors"
          />
          <Link2 className="w-4 h-4 text-slate-muted absolute left-3 top-3.5" />
        </div>

        <button
          onClick={fetchDetails}
          disabled={loading || !url.trim()}
          type="button"
          className="inline-flex items-center justify-center gap-2 bg-ink text-white hover:bg-ink/90 active:scale-98 disabled:opacity-40 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Fetching info...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-ribbon" />
              <span>Scrape Details</span>
            </>
          )}
        </button>
      </div>

      {preview && (
        <div className="mt-4 p-5 rounded-2xl bg-parchment-light/70 border border-parchment flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden relative border border-parchment bg-white shadow-2xs">
            {preview.image ? (
              <Image
                src={preview.image}
                alt="Product preview"
                fill
                sizes="112px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-muted text-xs gap-1">
                <PackageOpen className="w-6 h-6 stroke-1" />
                <span>No image</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3 w-full">
            <div>
              <label className="text-[11px] font-semibold text-slate-muted block mb-1">
                Title
              </label>
              <input
                type="text"
                maxLength={250}
                value={preview.title}
                onChange={(e) => setPreview({ ...preview, title: e.target.value })}
                placeholder="Product Title"
                className="w-full px-3 py-2 rounded-xl border border-parchment text-sm bg-white text-ink focus:outline-none focus:border-ink"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-muted block mb-1">
                  Price (Optional)
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={preview.price}
                  onChange={(e) => setPreview({ ...preview, price: e.target.value })}
                  placeholder="e.g. $65.00"
                  className="w-full px-3 py-2 rounded-xl border border-parchment text-sm bg-white text-ink focus:outline-none focus:border-ink tabular-nums"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-muted block mb-1">
                  Category
                </label>
                <select
                  value={preview.category}
                  onChange={(e) => setPreview({ ...preview, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-parchment text-sm bg-white text-ink focus:outline-none focus:border-ink cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-muted hover:text-ink transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 bg-ribbon text-white hover:bg-ribbon-hover active:scale-98 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Save to Registry</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
