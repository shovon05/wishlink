'use client'

import { useState } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { GripVertical, Edit2, Trash2, Check, X, ExternalLink, PackageOpen, CheckCircle2 } from 'lucide-react'

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
  const supabase = createClient()
  const router = useRouter()

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

      // Single atomic batch RPC call
      const { error: rpcError } = await supabase.rpc('reorder_wishlist_items', {
        p_item_ids: newItems.map((i) => i.id)
      })

      if (rpcError) {
        // Fallback update if RPC is missing in an older migration environment
        const updates = newItems.map((item, index) =>
          supabase.from('wishlist_items').update({ sort_order: index }).eq('id', item.id)
        )
        await Promise.all(updates)
      }

      router.refresh()
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((item) => (
            <SortableItem key={item.id} item={item} surpriseMode={surpriseMode} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function SortableItem({ item, surpriseMode }: { item: WishlistItem; surpriseMode?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const [isEditing, setIsEditing] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`paper-tag rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4 transition-shadow ${
        isDragging ? 'shadow-xl ring-2 ring-ink/10 opacity-95' : 'hover:shadow-xs'
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        aria-label="Drag to rearrange"
        className="cursor-grab active:cursor-grabbing text-slate-muted hover:text-ink focus:outline-none p-1 rounded-md hover:bg-parchment-light transition-colors"
      >
        <GripVertical className="w-4 h-4" />
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

      {/* Content or Edit Form */}
      {isEditing ? (
        <WishlistItemEditForm item={item} setIsEditing={setIsEditing} />
      ) : (
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <a
              href={item.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-sm text-ink hover:text-ribbon line-clamp-1 transition-colors flex items-center gap-1 group"
            >
              <span>{item.title || 'Untitled Wishlist Item'}</span>
              <ExternalLink className="w-3 h-3 text-slate-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </a>
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-slate-muted">
            {item.category && <span>{item.category}</span>}
            {item.price && (
              <>
                <span>·</span>
                <span className="font-semibold text-ink tabular-nums">{item.price}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {!isEditing && <WishlistItemActions item={item} setIsEditing={setIsEditing} surpriseMode={surpriseMode} />}
    </div>
  )
}

function WishlistItemActions({
  item,
  setIsEditing,
  surpriseMode,
}: {
  item: WishlistItem
  setIsEditing: (v: boolean) => void
  surpriseMode?: boolean
}) {
  const supabase = createClient()
  const router = useRouter()

  const handleDelete = async () => {
    if (window.confirm(`Delete "${item.title || 'this item'}" from your wishlist?`)) {
      await supabase.from('wishlist_items').delete().eq('id', item.id)
      router.refresh()
    }
  }

  if (!surpriseMode && (item.status === 'reserved' || item.status === 'gifted')) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-spruce-light text-spruce border border-spruce/30 shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>{item.status === 'reserved' ? 'Reserved' : 'Gifted'}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={() => setIsEditing(true)}
        type="button"
        title="Edit item details"
        aria-label="Edit item"
        className="p-1.5 rounded-lg text-slate-muted hover:text-ink hover:bg-parchment-light transition-colors cursor-pointer"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={handleDelete}
        type="button"
        title="Remove item"
        aria-label="Delete item"
        className="p-1.5 rounded-lg text-slate-muted hover:text-ribbon hover:bg-ribbon-light transition-colors cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function WishlistItemEditForm({ item, setIsEditing }: { item: WishlistItem; setIsEditing: (v: boolean) => void }) {
  const supabase = createClient()
  const router = useRouter()
  const CATEGORIES = ['All Gifts', 'Kitchenware', 'Home & Bedding', 'Books', 'Audio & Tech', 'Style', 'Experiences', 'Other']

  const [title, setTitle] = useState(item.title || '')
  const [price, setPrice] = useState(item.price || '')
  const [category, setCategory] = useState(item.category || 'All Gifts')
  const [saving, setSaving] = useState(false)

  const handleUpdate = async () => {
    setSaving(true)
    await supabase.from('wishlist_items').update({ title, price, category }).eq('id', item.id)
    setIsEditing(false)
    router.refresh()
  }

  return (
    <div className="flex-1 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 px-2.5 py-1 text-xs border border-parchment rounded-lg bg-white text-ink focus:outline-none focus:border-ink"
        placeholder="Product Title"
      />
      <input
        type="text"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full sm:w-24 px-2.5 py-1 text-xs border border-parchment rounded-lg bg-white text-ink focus:outline-none focus:border-ink tabular-nums"
        placeholder="Price"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full sm:w-28 px-2 py-1 text-xs border border-parchment rounded-lg bg-white text-ink focus:outline-none focus:border-ink cursor-pointer"
      >
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <div className="flex items-center gap-1 justify-end">
        <button
          onClick={handleUpdate}
          disabled={saving}
          type="button"
          className="inline-flex items-center gap-1 bg-ink text-white px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-ink/90 cursor-pointer"
        >
          <Check className="w-3 h-3 stroke-[2.5]" />
          <span>Save</span>
        </button>
        <button
          onClick={() => setIsEditing(false)}
          type="button"
          className="p-1 text-slate-muted hover:text-ink cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
