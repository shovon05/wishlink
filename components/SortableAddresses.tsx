'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, MapPin, Plus, Loader2, Zap, ShieldCheck, Check } from 'lucide-react'

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
  initialAutoShare = false,
}: {
  initialAddresses: AddressItem[]
  userId: string
  initialAutoShare?: boolean
}) {
  const [addresses, setAddresses] = useState<AddressItem[]>(initialAddresses)
  const [label, setLabel] = useState('Primary Home')
  const [fullAddress, setFullAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [autoShare, setAutoShare] = useState(initialAutoShare)
  const [savingAutoShare, setSavingAutoShare] = useState(false)
  const [autoShareMessage, setAutoShareMessage] = useState('')

  const supabase = createClient()
  const router = useRouter()

  const handleToggleAutoShare = async () => {
    const nextVal = !autoShare
    setAutoShare(nextVal)
    setSavingAutoShare(true)
    setAutoShareMessage('')

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ auto_share_address: nextVal })
        .eq('id', userId)

      if (updateError) throw updateError

      setAutoShareMessage(
        nextVal
          ? 'Auto-share enabled! Your default address will be shared immediately with active reservations.'
          : 'Auto-share disabled. You will manually approve each gift reservation.'
      )
      setTimeout(() => setAutoShareMessage(''), 4000)
    } catch {
      setAutoShare(!nextVal)
      setError('Failed to update address auto-share preference.')
    } finally {
      setSavingAutoShare(false)
    }
  }

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
    const isFirst = addresses.length === 0

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

    if (insertError) {
      setError(insertError.message || 'Failed to save address.')
    } else if (data) {
      setAddresses([...addresses, data as AddressItem])
      setLabel('Primary Home')
      setFullAddress('')
    }

    setLoading(false)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this delivery address from your profile?')) {
      await supabase.from('addresses').delete().eq('id', id)
      setAddresses(addresses.filter(a => a.id !== id))
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
        supabase.from('addresses').update({ priority: index, is_default: index === 0 }).eq('id', item.id)
      )
      await Promise.all(updates)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">

      {/* Auto-Share Default Address Option */}
      <div className="paper-tag rounded-3xl p-5 sm:p-6 bg-white border border-parchment space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-caramel" />
              <h3 className="font-serif font-bold text-sm text-ink">Auto-Share Default Address</h3>
            </div>
            <p className="text-xs text-slate-muted">
              Instantly share your top-priority address with gifters when they reserve, eliminating waiting time.
            </p>
          </div>

          <button
            type="button"
            disabled={savingAutoShare}
            onClick={handleToggleAutoShare}
            className={`self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              autoShare
                ? 'posh-button-primary shadow-2xs'
                : 'bg-parchment-light text-slate-muted hover:text-ink hover:bg-parchment border border-parchment'
            }`}
          >
            {savingAutoShare ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : autoShare ? (
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : null}
            <span>{autoShare ? 'Auto-Share: Enabled' : 'Auto-Share: Disabled'}</span>
          </button>
        </div>

        {autoShareMessage && (
          <div className="p-3.5 rounded-2xl bg-spruce-light border border-spruce/30 text-spruce text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <ShieldCheck className="w-4 h-4 shrink-0 text-spruce" />
            <span>{autoShareMessage}</span>
          </div>
        )}
      </div>

      {/* Add New Address Card */}
      <form onSubmit={handleAdd} className="paper-tag rounded-3xl p-6 sm:p-7 space-y-4 bg-white border border-parchment">
        <div>
          <h3 className="text-base font-serif font-bold text-ink">
            Add Delivery Address
          </h3>
          <p className="text-xs text-slate-muted">
            Enter your destination. Only disclosed to verified gifters with your explicit approval or auto-share rule.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-ribbon-light border border-ribbon/30 text-ribbon text-xs">
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
              className="w-full px-3.5 py-2.5 border border-parchment rounded-xl text-xs bg-white text-ink focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel cursor-pointer"
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
              className="w-full px-3.5 py-2 border border-parchment rounded-xl text-xs bg-white text-ink placeholder:text-slate-muted/60 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading || !fullAddress.trim()}
            className="posh-button-primary inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-40 cursor-pointer"
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
          <h3 className="text-sm font-serif font-bold text-ink">
            Saved Addresses ({addresses.length})
          </h3>
          <span className="text-xs text-slate-muted">
            Top address is default for auto-sharing · Drag to prioritize
          </span>
        </div>

        {addresses.length === 0 ? (
          <div className="paper-tag rounded-3xl p-10 text-center space-y-2 bg-white border border-parchment">
            <MapPin className="w-8 h-8 text-caramel mx-auto stroke-1" />
            <p className="text-xs text-slate-muted">No addresses saved yet. Add one above to enable gift disclosures.</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={addresses.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {addresses.map((addr, idx) => (
                  <SortableAddressItem
                    key={addr.id}
                    addr={addr}
                    isDefault={idx === 0}
                    onDelete={() => handleDelete(addr.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>
    </div>
  )
}

function SortableAddressItem({
  addr,
  isDefault,
  onDelete,
}: {
  addr: AddressItem
  isDefault: boolean
  onDelete: () => void
}) {
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
      className={`paper-tag rounded-2xl p-4 flex items-start gap-3 transition-shadow bg-white border border-parchment ${
        isDragging ? 'shadow-xl ring-2 ring-caramel/40 opacity-95' : 'hover:border-caramel/30 hover:shadow-xs'
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
        <div className="flex items-center gap-2">
          <span className="inline-block text-[10px] font-bold text-ink bg-parchment-light border border-parchment px-2 py-0.5 rounded-md uppercase tracking-wider">
            {addr.label || 'Home'}
          </span>
          {isDefault && (
            <span className="inline-block text-[10px] font-semibold text-spruce bg-spruce-light border border-spruce/30 px-2 py-0.5 rounded-md uppercase tracking-wider">
              Default Auto-Share
            </span>
          )}
        </div>
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
