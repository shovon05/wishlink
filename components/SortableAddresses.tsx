'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, MapPin, Plus, Loader2, ShieldCheck, Lock } from 'lucide-react'
import MaterialErrorBanner from '@/components/MaterialErrorBanner'

export interface AddressItem {
  id: string
  user_id: string
  label: string | null
  full_address: string
  priority: number
  is_default?: boolean
  created_at?: string
}

const LABELS = ['Primary Home', 'Current Residence', 'Work / Office', 'Family House', 'P.O. Box / Locker', 'Other']

export default function SortableAddresses({
  initialAddresses,
  userId,
}: {
  initialAddresses: AddressItem[]
  userId: string
  initialAutoShare?: boolean
}) {
  const [addresses, setAddresses] = useState<AddressItem[]>(initialAddresses)
  const [label, setLabel] = useState('Primary Home')
  const [fullAddress, setFullAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown | null>(null)

  const supabase = createClient()

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
    setError(null)

    const priority = addresses.length > 0 ? Math.max(...addresses.map(a => a.priority)) + 1 : 0
    const isFirst = addresses.length === 0

    try {
      const { data, error: insertError } = await supabase
        .from('addresses')
        .insert({
          user_id: userId,
          label: sanitizedLabel,
          full_address: sanitizedAddress,
          priority,
          is_default: isFirst,
        })
        .select()
        .single()

      if (insertError) throw insertError

      if (data) {
        setAddresses(prev => [...prev, data as AddressItem])
        setFullAddress('')
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this delivery address from your account?')) {
      setError(null)
      try {
        const { error: deleteError } = await supabase.from('addresses').delete().eq('id', id)
        if (deleteError) throw deleteError
        setAddresses(prev => prev.filter(a => a.id !== id))
      } catch (err) {
        setError(err)
      }
    }
  }

  const handleSetDefault = async (id: string) => {
    setError(null)
    try {
      const { error: resetError } = await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId)

      if (resetError) throw resetError

      const { error: updateError } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id)

      if (updateError) throw updateError

      setAddresses(prev =>
        prev.map(a => ({
          ...a,
          is_default: a.id === id,
        }))
      )
    } catch (err) {
      setError(err)
    }
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

    const oldIndex = addresses.findIndex(a => a.id === active.id)
    const newIndex = addresses.findIndex(a => a.id === over.id)
    const newItems = arrayMove(addresses, oldIndex, newIndex)

    setAddresses(newItems)

    try {
      const updates = newItems.map((item, idx) => ({
        id: item.id,
        user_id: userId,
        full_address: item.full_address,
        label: item.label,
        priority: idx,
        is_default: item.is_default ?? false,
      }))

      const { error: upsertError } = await supabase.from('addresses').upsert(updates)
      if (upsertError) throw upsertError
    } catch (err) {
      setError(err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Explicit Consent Privacy Guarantee Notice */}
      <div className="paper-tag rounded-3xl p-5 sm:p-6 bg-white border border-parchment space-y-3 md-elevation-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-spruce" />
              <h3 className="font-serif font-bold text-sm text-ink">Strict Consent Guarantee</h3>
            </div>
            <p className="text-xs text-slate-muted leading-relaxed">
              Your addresses are never disclosed automatically or displayed on your public wishlist.
              Each gifter must reserve an item, and you explicitly choose which destination to approve for every individual gift.
            </p>
          </div>

          <div className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-spruce-light text-spruce border border-spruce/30 shrink-0">
            <Lock className="w-3.5 h-3.5" />
            <span>Per-Request Approval</span>
          </div>
        </div>
      </div>

      {/* Add New Address Card */}
      <form onSubmit={handleAdd} className="paper-tag rounded-3xl p-6 sm:p-7 space-y-4 bg-white border border-parchment md-elevation-1">
        <div>
          <h3 className="text-base font-serif font-bold text-ink">
            Add Delivery Address
          </h3>
          <p className="text-xs text-slate-muted">
            Enter your destination. Disclosed only when you approve a gift request.
          </p>
        </div>

        {Boolean(error) && (
          <MaterialErrorBanner
            error={error}
            onDismiss={() => setError(null)}
            fallbackMessage="Failed to update database delivery addresses."
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="text-[11px] font-semibold text-slate-muted block mb-1">
              Label
            </label>
            <select
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-parchment rounded-xl text-xs bg-white text-ink focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel cursor-pointer min-h-[44px]"
            >
              {LABELS.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-[11px] font-semibold text-slate-muted block mb-1">
              Street, Apt/Suite, City, State, ZIP, Country *
            </label>
            <input
              type="text"
              required
              maxLength={500}
              placeholder="e.g. 120 Banani 11, Dhaka 1213"
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-parchment rounded-xl text-xs bg-white text-ink focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel min-h-[44px]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading || !fullAddress.trim()}
            className="posh-button-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer min-h-[44px]"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Save Address</span>
          </button>
        </div>
      </form>

      {/* Saved Addresses List */}
      <div className="space-y-3">
        <h3 className="text-sm font-serif font-bold text-ink px-1">
          Saved Destinations ({addresses.length})
        </h3>

        {addresses.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white border border-parchment space-y-2">
            <MapPin className="w-8 h-8 text-caramel/40 mx-auto stroke-1" />
            <p className="text-xs text-slate-muted">
              No addresses saved yet. Add a destination above so you can select it when approving gift requests.
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={addresses.map(a => a.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2.5">
                {addresses.map((addr) => (
                  <SortableAddressRow
                    key={addr.id}
                    address={addr}
                    onDelete={handleDelete}
                    onSetDefault={handleSetDefault}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}

function SortableAddressRow({
  address,
  onDelete,
  onSetDefault,
}: {
  address: AddressItem
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: address.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
    opacity: isDragging ? 0.7 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 rounded-2xl bg-white border border-parchment flex items-center justify-between gap-3 group hover:border-caramel/40 transition-colors shadow-2xs"
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1.5 text-slate-muted/50 hover:text-ink rounded-lg hover:bg-parchment-light transition-colors"
          title="Drag to reorder preference"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-ink font-serif">
              {address.label || 'Destination'}
            </span>
            {address.is_default && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-caramel/15 text-caramel border border-caramel/30">
                Default
              </span>
            )}
          </div>
          <p className="text-xs text-slate-muted truncate font-sans">
            {address.full_address}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!address.is_default && (
          <button
            type="button"
            onClick={() => onSetDefault(address.id)}
            className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-muted hover:text-ink hover:bg-parchment-light transition-colors cursor-pointer"
          >
            Set Default
          </button>
        )}

        <button
          type="button"
          onClick={() => onDelete(address.id)}
          className="p-2 text-slate-muted hover:text-error hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          title="Delete address"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
