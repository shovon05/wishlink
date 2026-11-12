'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, MapPin, Plus, Loader2 } from 'lucide-react'

export interface AddressItem {
  id: string
  user_id: string
  label: string | null
  full_address: string
  priority: number
  created_at?: string
}

const LABELS = ['Primary Home', 'Current Residence', 'Work / Office', 'Family House', 'P.O. Box / Locker', 'Other']

export default function SortableAddresses({ initialAddresses, userId }: { initialAddresses: AddressItem[], userId: string }) {
  const [addresses, setAddresses] = useState<AddressItem[]>(initialAddresses)
  const [label, setLabel] = useState('Primary Home')
  const [fullAddress, setFullAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    const sanitizedAddress = fullAddress.trim()
    const sanitizedLabel = label.trim()

    if (!sanitizedAddress) return
    if (sanitizedAddress.length > 500) {
      setError('Address is too long (maximum 500 characters).')
      return
    }

    setLoading(true)
    setError('')

    const priority = addresses.length > 0 ? Math.max(...addresses.map(a => a.priority)) + 1 : 0
    await supabase.from('addresses').insert({
      user_id: userId,
      label: sanitizedLabel,
      full_address: sanitizedAddress,
      priority,
    })

    setLabel('Primary Home')
    setFullAddress('')
    setLoading(false)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this delivery address from your profile?')) {
      await supabase.from('addresses').delete().eq('id', id)
      router.refresh()
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = addresses.findIndex(i => i.id === active.id)
      const newIndex = addresses.findIndex(i => i.id === over?.id)
      const newItems = arrayMove(addresses, oldIndex, newIndex)
      setAddresses(newItems)

      const updates = newItems.map((item, index) =>
        supabase.from('addresses').update({ priority: index }).eq('id', item.id)
      )
      await Promise.all(updates)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Add New Address Card */}
      <form onSubmit={handleAdd} className="paper-tag rounded-3xl p-6 sm:p-7 space-y-4">
        <div>
          <h3 className="text-base font-serif font-bold text-ink">
            Add Private Delivery Address
          </h3>
          <p className="text-xs text-slate-muted">
            Enter your destination address. Only disclosed to verified gifters with your explicit approval.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-ribbon-light border border-ribbon/20 text-ribbon text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="text-[11px] font-semibold text-slate-muted block mb-1">
              Label
            </label>
            <select
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-parchment rounded-xl text-xs bg-white text-ink focus:outline-none focus:border-ink cursor-pointer"
            >
              {LABELS.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-[11px] font-semibold text-slate-muted block mb-1">
              Full Address & Delivery Instructions
            </label>
            <textarea
              required
              maxLength={500}
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              placeholder="e.g. 742 Evergreen Terrace, Apt 4B, Springfield OR 97477 (Gate code #1234)"
              rows={2}
              className="w-full px-3.5 py-2 border border-parchment rounded-xl text-xs bg-white text-ink placeholder:text-slate-muted/60 focus:outline-none focus:border-ink resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading || !fullAddress.trim()}
            className="inline-flex items-center gap-1.5 bg-ink text-white hover:bg-ink/90 active:scale-98 disabled:opacity-40 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Address...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Save Address</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Address List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-ink">
            Saved Addresses ({addresses.length})
          </h3>
          <span className="text-xs text-slate-muted">
            Drag to prioritize
          </span>
        </div>

        {addresses.length === 0 ? (
          <div className="paper-tag rounded-3xl p-10 text-center space-y-2">
            <MapPin className="w-8 h-8 text-slate-muted mx-auto stroke-1" />
            <p className="text-xs text-slate-muted">No addresses saved yet. Add one above to enable gift disclosures.</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={addresses.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <SortableAddressItem key={addr.id} addr={addr} onDelete={() => handleDelete(addr.id)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>
    </div>
  )
}

function SortableAddressItem({ addr, onDelete }: { addr: AddressItem, onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: addr.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`paper-tag rounded-2xl p-4 flex items-start gap-3 transition-shadow ${
        isDragging ? 'shadow-xl ring-2 ring-ink/10 opacity-95' : 'hover:shadow-xs'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        aria-label="Drag to reorder address priority"
        className="cursor-grab active:cursor-grabbing text-slate-muted hover:text-ink mt-0.5 p-1 rounded-md hover:bg-parchment-light transition-colors"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0 space-y-1">
        <span className="inline-block text-[10px] font-bold text-ink bg-parchment-light border border-parchment px-2 py-0.5 rounded-md uppercase tracking-wider">
          {addr.label || 'Home'}
        </span>
        <p className="text-xs text-ink font-mono whitespace-pre-wrap leading-relaxed pt-0.5">
          {addr.full_address}
        </p>
      </div>

      <button
        onClick={onDelete}
        type="button"
        aria-label="Delete address"
        className="p-1.5 rounded-lg text-slate-muted hover:text-ribbon hover:bg-ribbon-light transition-colors cursor-pointer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
