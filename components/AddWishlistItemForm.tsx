'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Plus, Link2, Sparkles, Loader2, PackageOpen, AlertCircle, Info } from 'lucide-react'

const CATEGORIES = ['All Gifts', 'Kitchenware', 'Home & Bedding', 'Books', 'Audio & Tech', 'Style', 'Experiences', 'Other']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'BDT', 'INR', 'JPY']

export default function AddWishlistItemForm({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [infoNotice, setInfoNotice] = useState('')
  const [preview, setPreview] = useState<{
    title: string
    image: string
    price: string
    currency: string
    category: string
  } | null>(null)

  const fetchDetails = async () => {
    const sanitizedUrl = url.trim()
    if (!sanitizedUrl) return

    setLoading(true)
    setFormError('')
    setInfoNotice('')

    try {
      const res = await fetch('/api/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sanitizedUrl }),
      })
      const data = await res.json()

      if (!data.success && data.message) {
        setInfoNotice(data.message)
      }

      setPreview({
        title: data.title || '',
        image: data.image || '',
        price: data.displayPrice || data.price || '',
        currency: data.currency || 'USD',
        category: 'All Gifts',
      })
    } catch {
      setInfoNotice('Could not reach this store automatically. You can fill in the details below.')
      setPreview({
        title: '',
        image: '',
        price: '',
        currency: 'USD',
        category: 'All Gifts',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManualOpen = () => {
    setPreview({
      title: '',
      image: '',
      price: '',
      currency: 'USD',
      category: 'All Gifts',
    })
    setFormError('')
    setInfoNotice('')
  }

  const handleSave = async () => {
    if (!preview) return

    const sanitizedUrl = url.trim() || 'https://wishlink.me'
    const sanitizedTitle = preview.title.trim().substring(0, 250)
    const sanitizedPrice = preview.price.trim().substring(0, 50)

    if (!sanitizedTitle) {
      setFormError('Please enter a product title.')
      return
    }

    // Parse numeric price amount if available
    const numericAmount = parseFloat(sanitizedPrice.replace(/[^0-9.]/g, ''))
    const priceAmount = !isNaN(numericAmount) && numericAmount > 0 ? numericAmount : null

    setSaving(true)
    setFormError('')

    try {
      const { data: maxItem } = await supabase
        .from('wishlist_items')
        .select('sort_order')
        .eq('user_id', userId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle()

      const nextSortOrder = maxItem ? maxItem.sort_order + 1 : 0

      const { error: insertError } = await supabase.from('wishlist_items').insert({
        user_id: userId,
        product_url: sanitizedUrl,
        title: sanitizedTitle,
        image_url: preview.image.trim() || null,
        price: sanitizedPrice || null,
        price_amount: priceAmount,
        price_currency: preview.currency || 'USD',
        category: preview.category,
        sort_order: nextSortOrder,
      })

      if (insertError) {
        throw new Error(insertError.message || 'Failed to save item to your wishlist.')
      }

      setUrl('')
      setPreview(null)
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to save item. Please try again.'
      setFormError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-ink">
            Add to Wishlist
          </h2>
          <p className="text-xs text-slate-muted">
            Paste any link from an online store, or enter items manually.
          </p>
        </div>

        {!preview && (
          <button
            type="button"
            onClick={handleManualOpen}
            className="self-start sm:self-auto text-xs text-slate-muted hover:text-ink font-medium underline underline-offset-4 cursor-pointer"
          >
            Or add without link
          </button>
        )}
      </div>

      {formError && (
        <div className="p-3 rounded-xl bg-ribbon-light border border-ribbon/20 text-ribbon text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {infoNotice && (
        <div className="p-3 rounded-xl bg-parchment-light border border-parchment text-slate-muted text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-ink shrink-0" />
          <span>{infoNotice}</span>
        </div>
      )}

      {!preview && (
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="url"
              maxLength={1000}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste product link (Amazon, Etsy, Apple, or local boutique)..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-parchment text-sm bg-white text-ink placeholder:text-slate-muted/60 focus:outline-none focus:border-ink transition-colors"
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
                <span>Checking link...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-ribbon" />
                <span>Fetch Details</span>
              </>
            )}
          </button>
        </div>
      )}

      {preview && (
        <div className="mt-2 p-5 rounded-2xl bg-parchment-light/60 border border-parchment flex flex-col sm:flex-row gap-5 items-start">
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
                <PackageOpen className="w-6 h-6 stroke-1 text-slate-muted/60" />
                <span className="text-[10px]">No image</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3 w-full">
            <div>
              <label className="text-[11px] font-semibold text-slate-muted block mb-1">
                Product Title *
              </label>
              <input
                type="text"
                maxLength={250}
                required
                value={preview.title}
                onChange={(e) => setPreview({ ...preview, title: e.target.value })}
                placeholder="e.g. Linen Bedding Set"
                className="w-full px-3 py-2 rounded-xl border border-parchment text-sm bg-white text-ink focus:outline-none focus:border-ink"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-muted block mb-1">
                Store or Product Link (Optional)
              </label>
              <input
                type="url"
                maxLength={1000}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl border border-parchment text-xs bg-white text-ink focus:outline-none focus:border-ink font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-muted block mb-1">
                  Price Display
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={preview.price}
                  onChange={(e) => setPreview({ ...preview, price: e.target.value })}
                  placeholder="e.g. $45.00"
                  className="w-full px-3 py-2 rounded-xl border border-parchment text-xs bg-white text-ink focus:outline-none focus:border-ink tabular-nums"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-muted block mb-1">
                  Currency
                </label>
                <select
                  value={preview.currency}
                  onChange={(e) => setPreview({ ...preview, currency: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-parchment text-xs bg-white text-ink focus:outline-none focus:border-ink cursor-pointer"
                >
                  {CURRENCIES.map((cur) => (
                    <option key={cur} value={cur}>{cur}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-muted block mb-1">
                  Category
                </label>
                <select
                  value={preview.category}
                  onChange={(e) => setPreview({ ...preview, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-parchment text-xs bg-white text-ink focus:outline-none focus:border-ink cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-muted block mb-1">
                Image URL (Optional)
              </label>
              <input
                type="url"
                maxLength={1000}
                value={preview.image}
                onChange={(e) => setPreview({ ...preview, image: e.target.value })}
                placeholder="https://images... (paste image link)"
                className="w-full px-3 py-1.5 rounded-xl border border-parchment text-xs bg-white text-ink focus:outline-none focus:border-ink font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-parchment">
              <button
                type="button"
                onClick={() => {
                  setPreview(null)
                  setFormError('')
                  setInfoNotice('')
                }}
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
                    <span>Saving Item...</span>
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
