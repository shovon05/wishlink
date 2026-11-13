'use client'

import { useState } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  GripVertical, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  ExternalLink, 
  PackageOpen, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Sparkles,
  Loader2
} from 'lucide-react'
import MaterialErrorBanner from '@/components/MaterialErrorBanner'

export interface WishlistItem {
  id: string
  user_id: string
  product_url: string
  title: string | null
  image_url: string | null
  price: string | null
  category: string | null
  sort_order: number
  status: 'available' | 'reserved' | 'gifted'
  created_at?: string
}

export default function SortableWishlist({
  items: initialItems,
  surpriseMode = false,
}: {
  items: WishlistItem[]
  surpriseMode?: boolean
}) {
  const [items, setItems] = useState<WishlistItem[]>(initialItems)
  const [prevInitialItems, setPrevInitialItems] = useState(initialItems)

  if (prevInitialItems !== initialItems) {
    setPrevInitialItems(initialItems)
    setItems(initialItems)
  }

  const [filterMode, setFilterMode] = useState<'all' | 'available' | 'gifted'>('all')
  const [dbError, setDbError] = useState<unknown | null>(null)

  const [hideGifted, setHideGifted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem('wishlink_hide_gifted_pref') === 'true'
    } catch {
      return false
    }
  })

  const [hiddenItemIds, setHiddenItemIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem('wishlink_hidden_items')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const supabase = createClient()
  const router = useRouter()

  const toggleHideGifted = () => {
    const nextState = !hideGifted
    setHideGifted(nextState)
    try {
      localStorage.setItem('wishlink_hide_gifted_pref', String(nextState))
    } catch {}
  }

  const toggleHideSpecificItem = (itemId: string) => {
    setHiddenItemIds((prev) => {
      const next = prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
      try {
        localStorage.setItem('wishlink_hidden_items', JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const handleUnhideAll = () => {
    setHiddenItemIds([])
    setHideGifted(false)
    try {
      localStorage.removeItem('wishlink_hidden_items')
      localStorage.setItem('wishlink_hide_gifted_pref', 'false')
    } catch {}
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over?.id)

      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)
      setDbError(null)

      try {
        // Single atomic batch RPC call
        const { error: rpcError } = await supabase.rpc('reorder_wishlist_items', {
          p_item_ids: newItems.map((i) => i.id)
        })

        if (rpcError) {
          const updates = newItems.map((item, index) =>
            supabase.from('wishlist_items').update({ sort_order: index }).eq('id', item.id)
          )
          const results = await Promise.all(updates)
          const failedResult = results.find(r => r.error)
          if (failedResult?.error) {
            setDbError(failedResult.error)
            return
          }
        }

        router.refresh()
      } catch (err) {
        setDbError(err)
      }
    }
  }

  const handleDeleteItem = async (itemId: string, itemTitle: string | null) => {
    if (window.confirm(`Permanently remove "${itemTitle || 'this item'}" from your wishlist?`)) {
      setDbError(null)
      const previousItems = items
      setItems((prev) => prev.filter((i) => i.id !== itemId))
      setHiddenItemIds((prev) => prev.filter((id) => id !== itemId))

      try {
        const { error: delError } = await supabase.from('wishlist_items').delete().eq('id', itemId)
        if (delError) {
          setItems(previousItems)
          setDbError(delError)
          return
        }
        router.refresh()
      } catch (err) {
        setItems(previousItems)
        setDbError(err)
      }
    }
  }

  // Filter items based on active tabs, hideGifted toggle, and individual hiddenItemIds
  const giftedCount = items.filter((i) => i.status === 'gifted').length
  const reservedCount = items.filter((i) => i.status === 'reserved').length
  const availableCount = items.filter((i) => i.status === 'available').length

  const visibleItems = items.filter((item) => {
    // 1. Explicitly hidden individual items
    const isIndividuallyHidden = hiddenItemIds.includes(item.id)
    if (isIndividuallyHidden) return false

    // 2. Global hide gifted items toggle
    if (hideGifted && item.status === 'gifted') return false

    // 3. Tab filter
    if (filterMode === 'available') return item.status === 'available'
    if (filterMode === 'gifted') return item.status === 'gifted' || item.status === 'reserved'
    return true
  })

  const totalHiddenCount = items.length - visibleItems.length

  return (
    <div className="space-y-4">
      {Boolean(dbError) && (
        <MaterialErrorBanner
          error={dbError}
          onDismiss={() => setDbError(null)}
          fallbackMessage="Database operation could not be saved."
        />
      )}

      {/* Editorial Filter & Visibility Controls */}
      <div className="paper-tag rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-parchment md-elevation-1">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-parchment-light/60 rounded-xl border border-parchment/60 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 min-h-[36px] ${
              filterMode === 'all'
                ? 'bg-white text-ink shadow-2xs border border-parchment/70'
                : 'text-slate-muted hover:text-ink'
            }`}
          >
            All Items ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('available')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 min-h-[36px] ${
              filterMode === 'available'
                ? 'bg-white text-ink shadow-2xs border border-parchment/70'
                : 'text-slate-muted hover:text-ink'
            }`}
          >
            Available ({availableCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('gifted')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 min-h-[36px] ${
              filterMode === 'gifted'
                ? 'bg-white text-ink shadow-2xs border border-parchment/70'
                : 'text-slate-muted hover:text-ink'
            }`}
          >
            Gifted & Reserved ({giftedCount + reservedCount})
          </button>
        </div>

        {/* Hide Gifted Toggle & Hidden Counter */}
        <div className="flex items-center gap-2 justify-end flex-wrap">
          {giftedCount > 0 && (
            <button
              type="button"
              onClick={toggleHideGifted}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border min-h-[36px] ${
                hideGifted
                  ? 'bg-mocha text-cotton border-mocha/30 shadow-2xs'
                  : 'bg-white text-slate-muted hover:text-ink border-parchment hover:bg-parchment-light/40'
              }`}
              title={hideGifted ? 'Show all gifted items' : 'Hide completed gifted items from list'}
            >
              {hideGifted ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-blush" />
                  <span>Gifted Hidden</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Hide Gifted</span>
                </>
              )}
            </button>
          )}

          {totalHiddenCount > 0 && (
            <button
              type="button"
              onClick={handleUnhideAll}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-semibold text-ribbon hover:text-ribbon-hover bg-ribbon-light/80 border border-ribbon/20 transition-colors cursor-pointer min-h-[36px]"
            >
              <span>Unhide All ({totalHiddenCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Wishlist Items List */}
      {visibleItems.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={visibleItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {visibleItems.map((item) => (
                <SortableItem 
                  key={item.id} 
                  item={item} 
                  surpriseMode={surpriseMode} 
                  onDelete={handleDeleteItem}
                  onToggleHide={toggleHideSpecificItem}
                  onError={(err) => setDbError(err)}
                  isIndividuallyHidden={hiddenItemIds.includes(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="paper-tag rounded-3xl p-10 text-center space-y-3 bg-white border border-parchment md-elevation-1">
          <div className="w-12 h-12 rounded-2xl bg-parchment-light text-caramel flex items-center justify-center mx-auto border border-parchment">
            <PackageOpen className="w-6 h-6 stroke-1 text-slate-muted" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-ink text-sm sm:text-base">
              {filterMode !== 'all' ? 'No items match this filter' : 'Your wishlist registry is empty'}
            </h3>
            <p className="text-xs text-slate-muted max-w-sm mx-auto">
              {filterMode !== 'all' 
                ? 'Try toggling filters or unhiding previously saved gifts.'
                : 'Paste a product link above or enter details manually to start curating.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function SortableItem({
  item,
  surpriseMode,
  onDelete,
  onToggleHide,
  onError,
  isIndividuallyHidden,
}: {
  item: WishlistItem
  surpriseMode: boolean
  onDelete: (id: string, title: string | null) => void
  onToggleHide: (id: string) => void
  onError: (err: unknown) => void
  isIndividuallyHidden: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const [isEditing, setIsEditing] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  }

  const isGifted = item.status === 'gifted'
  const isReserved = item.status === 'reserved'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`paper-tag rounded-2xl p-3 sm:p-4.5 flex items-center gap-3 sm:gap-4 transition-all bg-white border border-parchment md-elevation-1 ${
        isDragging 
          ? 'shadow-xl ring-2 ring-caramel/40 opacity-95 scale-[1.01]' 
          : 'hover:border-caramel/30 hover:md-elevation-2'
      } ${isGifted ? 'bg-gradient-to-r from-white via-white to-parchment-light/25' : ''}`}
    >
      {/* Drag Handle with touch target */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        aria-label="Drag to reorder"
        className="cursor-grab active:cursor-grabbing text-slate-muted hover:text-ink focus:outline-none p-2 rounded-xl hover:bg-parchment-light transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
      >
        <GripVertical className="w-4 h-4 stroke-[2]" />
      </button>

      {/* Product Image */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl overflow-hidden relative border border-parchment bg-parchment-light shadow-2xs">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title || 'Product'}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-muted">
            <PackageOpen className="w-5 h-5 stroke-1" />
          </div>
        )}
      </div>

      {/* Content or Inline Edit Form */}
      {isEditing ? (
        <WishlistItemEditForm item={item} setIsEditing={setIsEditing} onError={onError} />
      ) : (
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <a
              href={item.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-xs sm:text-sm text-ink hover:text-ribbon line-clamp-1 transition-colors flex items-center gap-1 group"
            >
              <span>{item.title || 'Untitled Wishlist Item'}</span>
              <ExternalLink className="w-3 h-3 text-slate-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </a>

            {/* Badges for status */}
            {!surpriseMode && isGifted && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-blush/40 text-mocha border border-blush/80">
                <Sparkles className="w-3 h-3 text-ribbon" />
                <span>Gifted</span>
              </span>
            )}
            {!surpriseMode && isReserved && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-spruce-light text-spruce border border-spruce/30">
                <CheckCircle2 className="w-3 h-3 text-spruce" />
                <span>Reserved</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-muted">
            {item.category && (
              <span className="px-2 py-0.5 rounded-md bg-parchment-light/60 font-medium text-[10px] sm:text-[11px] text-ink-muted">
                {item.category}
              </span>
            )}
            {item.price && (
              <>
                <span className="text-parchment">·</span>
                <span className="font-semibold text-ink tabular-nums text-xs sm:text-sm">{item.price}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Action Suite (Edit, Hide, Remove) with accessible min touch sizes */}
      {!isEditing && (
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {/* Hide/Unhide Item Button */}
          <button
            onClick={() => onToggleHide(item.id)}
            type="button"
            title={isIndividuallyHidden ? 'Unhide item' : 'Hide item from list'}
            aria-label={isIndividuallyHidden ? 'Unhide item' : 'Hide item from list'}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-slate-muted hover:text-ink hover:bg-parchment-light transition-colors cursor-pointer flex items-center justify-center"
          >
            {isIndividuallyHidden ? <Eye className="w-4 h-4 text-caramel" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(true)}
            type="button"
            title="Edit item details"
            aria-label="Edit item"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-slate-muted hover:text-ink hover:bg-parchment-light transition-colors cursor-pointer flex items-center justify-center"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Remove / Delete Button */}
          <button
            onClick={() => onDelete(item.id, item.title)}
            type="button"
            title={isGifted ? 'Remove gifted item from wishlist' : 'Remove item'}
            aria-label={isGifted ? 'Remove gifted item from wishlist' : 'Remove item'}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-slate-muted hover:text-ribbon hover:bg-ribbon-light transition-colors cursor-pointer flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

function WishlistItemEditForm({ 
  item, 
  setIsEditing,
  onError 
}: { 
  item: WishlistItem
  setIsEditing: (v: boolean) => void
  onError: (err: unknown) => void
}) {
  const supabase = createClient()
  const router = useRouter()
  const CATEGORIES = ['All Gifts', 'Kitchenware', 'Home & Bedding', 'Books', 'Audio & Tech', 'Style', 'Experiences', 'Other']

  const [title, setTitle] = useState(item.title || '')
  const [price, setPrice] = useState(item.price || '')
  const [category, setCategory] = useState(item.category || 'All Gifts')
  const [saving, setSaving] = useState(false)

  const handleUpdate = async () => {
    setSaving(true)
    try {
      const { error: updateError } = await supabase
        .from('wishlist_items')
        .update({ title, price, category })
        .eq('id', item.id)

      if (updateError) {
        onError(updateError)
        return
      }

      setIsEditing(false)
      router.refresh()
    } catch (err) {
      onError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 px-3 py-2 text-xs border border-parchment rounded-xl bg-white text-ink focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel min-h-[36px]"
        placeholder="Product Title"
      />
      <input
        type="text"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full sm:w-24 px-3 py-2 text-xs border border-parchment rounded-xl bg-white text-ink focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel tabular-nums min-h-[36px]"
        placeholder="Price"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full sm:w-32 px-2.5 py-2 text-xs border border-parchment rounded-xl bg-white text-ink focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel cursor-pointer min-h-[36px]"
      >
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <div className="flex items-center gap-1.5 justify-end">
        <button
          onClick={handleUpdate}
          disabled={saving}
          type="button"
          className="inline-flex items-center gap-1 bg-mocha text-cotton px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-mocha-hover transition-all cursor-pointer shadow-2xs min-h-[36px]"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
          <span>Save</span>
        </button>
        <button
          onClick={() => setIsEditing(false)}
          type="button"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-muted hover:text-ink hover:bg-parchment-light transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
