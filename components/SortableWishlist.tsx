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
  Trash2, 
  ExternalLink, 
  PackageOpen, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Sparkles
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
      localStorage.removeItem('wishlink_hide_gifted_pref')
    } catch {}
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setDbError(null)

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)

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
          // Fallback to server route handler
          const serverRes = await fetch(`/api/wishlist/item?id=${itemId}`, { method: 'DELETE' }).catch(() => null)
          if (serverRes && serverRes.ok) {
            router.refresh()
            return
          }
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
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[36px] ${
                hideGifted
                  ? 'bg-mocha text-cotton shadow-xs'
                  : 'bg-white text-slate-muted hover:text-ink border border-parchment hover:bg-parchment-light'
              }`}
            >
              {hideGifted ? <EyeOff className="w-3.5 h-3.5 text-blush" /> : <Eye className="w-3.5 h-3.5 text-caramel" />}
              <span>{hideGifted ? 'Gifted: Hidden' : 'Hide Gifted'}</span>
            </button>
          )}

          {totalHiddenCount > 0 && (
            <button
              type="button"
              onClick={handleUnhideAll}
              className="text-[11px] font-semibold text-caramel hover:text-mocha underline px-1 py-1 cursor-pointer transition-colors"
            >
              Unhide {totalHiddenCount} {totalHiddenCount === 1 ? 'item' : 'items'}
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
  onDelete,
  onToggleHide,
  isIndividuallyHidden,
}: {
  item: WishlistItem
  surpriseMode?: boolean
  onDelete: (id: string, title: string | null) => void
  onToggleHide: (id: string) => void
  isIndividuallyHidden: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

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
        <GripVertical className="w-4 h-4 text-slate-muted/60" />
      </button>

      {/* Item Image with Fallback */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-parchment-light relative shrink-0 border border-parchment">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title || 'Product'}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-muted">
            <PackageOpen className="w-6 h-6 stroke-1 text-caramel/60" />
          </div>
        )}
        {isGifted && (
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-2xs flex items-center justify-center">
            <span className="text-[10px] font-bold text-white bg-spruce px-2 py-0.5 rounded-full uppercase tracking-wider">
              Gifted
            </span>
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-xs sm:text-sm font-serif font-bold text-ink truncate max-w-sm">
            {item.title || 'Untitled Wish'}
          </h3>
          
          {/* Status Badges */}
          {isGifted && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-spruce bg-spruce-light px-2 py-0.5 rounded-full border border-spruce/30">
              <CheckCircle2 className="w-3 3-h text-spruce" />
              Gifted
            </span>
          )}
          {isReserved && !isGifted && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-ribbon bg-ribbon-light px-2 py-0.5 rounded-full border border-ribbon/30">
              <Sparkles className="w-3 h-3 text-ribbon" />
              Reserved
            </span>
          )}
        </div>

        {/* Price & Category */}
        <div className="flex items-center gap-3 text-xs text-slate-muted">
          {item.price && (
            <span className="font-semibold text-ink font-mono">
              {item.price}
            </span>
          )}
          {item.category && item.category !== 'All Gifts' && (
            <span className="px-2 py-0.5 rounded-md bg-parchment-light text-[10px] font-medium text-slate-muted">
              {item.category}
            </span>
          )}
          {item.product_url && item.product_url !== 'https://wishlink.me' && (
            <a
              href={item.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-caramel hover:text-mocha transition-colors"
            >
              <span>Store Link</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onToggleHide(item.id)}
          title={isIndividuallyHidden ? 'Unhide item' : 'Hide from view'}
          className="p-2 text-slate-muted hover:text-ink hover:bg-parchment-light rounded-xl transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          {isIndividuallyHidden ? (
            <Eye className="w-4 h-4 text-caramel" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onDelete(item.id, item.title)}
          title="Delete item"
          className="p-2 text-slate-muted hover:text-error hover:bg-rose-50 rounded-xl transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
