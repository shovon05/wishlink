'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Plus, Link2, Sparkles, Loader2, PackageOpen, Info } from 'lucide-react'
import MaterialErrorBanner from '@/components/MaterialErrorBanner'

const CATEGORIES = ['All Gifts', 'Kitchenware', 'Home & Bedding', 'Books', 'Audio & Tech', 'Style', 'Experiences', 'Other']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'BDT', 'INR', 'JPY']

export default function AddWishlistItemForm({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<unknown | null>(null)
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
    setFormError(null)
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
      setInfoNotice('Could not reach this boutique automatically. You can fill in the details below.')
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
    setFormError(null)
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

    const numericAmount = parseFloat(sanitizedPrice.replace(/[^0-9.]/g, ''))
    const priceAmount = !isNaN(numericAmount) && numericAmount > 0 ? numericAmount : null

    setSaving(true)
    setFormError(null)

    try {
      const { data: maxItem, error: maxItemError } = await supabase
        .from('wishlist_items')
        .select('sort_order')
        .eq('user_id', userId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (maxItemError) {
        console.warn('Database sort_order lookup notice:', maxItemError)
      }

      const nextSortOrder = maxItem ? maxItem.sort_order + 1 : 0

      // 1. Direct Supabase client insertion
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
        // 2. Fail-safe layer: If client encounters permission error (code 42501),
        // fallback to server-authenticated route handler
        try {
          const serverRes = await fetch('/api/wishlist/item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_url: sanitizedUrl,
              title: sanitizedTitle,
              image_url: preview.image.trim() || null,
              price: priceAmount,
              currency: preview.currency || 'USD',
              category: preview.category,
              sort_order: nextSortOrder,
            }),
          })
          const serverData = await serverRes.json().catch(() => null)
          if (serverRes.ok && serverData && serverData.success) {
            setUrl('')
            setPreview(null)
            router.refresh()
            return
          }
        } catch {
          // Fall through to display detailed database error banner
        }

        setFormError(insertError)
        return
      }

      setUrl('')
      setPreview(null)
      router.refresh()
    } catch (err) {
      setFormError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-serif font-bold text-ink">
            Add to Wishlist
          </h2>
          <p className="text-xs text-slate-muted">
            Paste any link from an online store, or enter details manually.
          </p>
        </div>

        {!preview && (
          <button
            type="button"
            onClick={handleManualOpen}
            className="self-start sm:self-auto text-xs text-caramel hover:text-mocha font-semibold transition-colors cursor-pointer py-1"
          >
            + Enter manually
          </button>
        )}
      </div>

      {Boolean(formError) && (
        <MaterialErrorBanner
          error={formError}
          onDismiss={() => setFormError(null)}
          onRetry={handleSave}
          fallbackMessage="Unable to save wishlist item to the database."
        />
      )}

      {infoNotice && (
        <div className="p-3.5 rounded-2xl bg-parchment-light border border-caramel/25 text-xs text-slate-muted flex items-center gap-2">
          <Info className="w-4 h-4 text-caramel shrink-0" />
          <span>{infoNotice}</span>
        </div>
      )}

      {/* URL Input Form */}
      {!preview && (
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-caramel pointer-events-none" />
            <input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), fetchDetails())}
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 bg-white border border-parchment rounded-2xl text-xs sm:text-sm text-ink placeholder:text-slate-muted/60 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-all shadow-2xs min-h-[44px]"
            />
          </div>
          <button
            onClick={fetchDetails}
            disabled={loading || !url.trim()}
            className="posh-button-primary disabled:opacity-50 px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs shrink-0 min-h-[44px]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-blush" />
            )}
            <span>{loading ? 'Inspecting Link...' : 'Inspect Link'}</span>
          </button>
        </div>
      )}

      {/* Edit / Confirmation Drawer */}
      {preview && (
        <div className="paper-tag rounded-3xl p-5 sm:p-6 space-y-4 bg-white border border-parchment md-elevation-1 animate-in fade-in duration-200">
          <div className="flex items-start gap-4">
            {/* Image Preview Box */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-parchment-light relative shrink-0 border border-parchment">
              {preview.image ? (
                <Image
                  src={preview.image}
                  alt="Item preview"
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-muted gap-1 text-[10px]">
                  <PackageOpen className="w-6 h-6 stroke-1 text-caramel/60" />
                  <span>No image</span>
                </div>
              )}
            </div>

            {/* Editable Fields */}
            <div className="flex-1 space-y-2.5 min-w-0">
              <div>
                <label className="text-[11px] font-semibold text-slate-muted block mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Linen Bedding Set"
                  value={preview.title}
                  onChange={(e) => setPreview({ ...preview, title: e.target.value })}
                  className="w-full px-3.5 py-2 border border-parchment rounded-xl text-xs sm:text-sm bg-white text-ink focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel min-h-[40px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-muted block mb-1">
                    Price / Value
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 120.00"
                    value={preview.price}
                    onChange={(e) => setPreview({ ...preview, price: e.target.value })}
                    className="w-full px-3.5 py-2 border border-parchment rounded-xl text-xs sm:text-sm bg-white text-ink focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-muted block mb-1">
                    Currency
                  </label>
                  <select
                    value={preview.currency}
                    onChange={(e) => setPreview({ ...preview, currency: e.target.value })}
                    className="w-full px-3.5 py-2 border border-parchment rounded-xl text-xs sm:text-sm bg-white text-ink focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel cursor-pointer min-h-[40px]"
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-slate-muted block mb-1">
                Category
              </label>
              <select
                value={preview.category}
                onChange={(e) => setPreview({ ...preview, category: e.target.value })}
                className="w-full px-3.5 py-2 border border-parchment rounded-xl text-xs sm:text-sm bg-white text-ink focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel cursor-pointer min-h-[40px]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-muted block mb-1">
                Image Link (optional)
              </label>
              <input
                type="url"
                placeholder="https://...image.jpg"
                value={preview.image}
                onChange={(e) => setPreview({ ...preview, image: e.target.value })}
                className="w-full px-3.5 py-2 border border-parchment rounded-xl text-xs sm:text-sm bg-white text-ink focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel min-h-[40px]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-parchment">
            <button
              onClick={() => {
                setPreview(null)
                setUrl('')
                setFormError(null)
              }}
              disabled={saving}
              className="px-4 py-2.5 text-xs font-semibold text-slate-muted hover:text-ink transition-colors cursor-pointer min-h-[40px]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !preview.title.trim()}
              className="posh-button-primary disabled:opacity-50 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[40px]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>{saving ? 'Adding to Registry...' : 'Add to Wishlist'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
