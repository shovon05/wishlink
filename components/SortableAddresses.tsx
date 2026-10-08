'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'

const LABELS = ['Home', 'Local', 'Current', 'Work', 'Other']

export default function SortableAddresses({ initialAddresses, userId }: { initialAddresses: any[], userId: string }) {
  const [addresses, setAddresses] = useState(initialAddresses)
  const [label, setLabel] = useState('Home')
  const [fullAddress, setFullAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    // স্যানিটাইজেশন এবং ভ্যালিডেশন
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
      priority
    })

    setLabel('Home')
    setFullAddress('')
    setLoading(false)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if(confirm('Are you sure you want to delete this address?')) {
      await supabase.from('addresses').delete().eq('id', id)
      router.refresh()
    }
  }

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const handleDragEnd = async (event: any) => {
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
    <div className="space-y-8">
      <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <h3 className="font-bold text-gray-800">Add New Address</h3>

        {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

        <div className="flex flex-col md:flex-row gap-4">
          <select value={label} onChange={(e) => setLabel(e.target.value)} className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {LABELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <textarea
            required
            maxLength={500}
            value={fullAddress}
            onChange={(e) => setFullAddress(e.target.value)}
            placeholder="Full delivery address with instructions..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 resize-none h-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button disabled={loading || !fullAddress.trim()} className="self-end bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition">
          {loading ? 'Adding...' : 'Save Address'}
        </button>
      </form>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={addresses.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {addresses.map((addr) => (
              <SortableAddressItem key={addr.id} addr={addr} onDelete={() => handleDelete(addr.id)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableAddressItem({ addr, onDelete }: { addr: any, onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: addr.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className="bg-white p-4 rounded-xl border border-gray-200 flex items-start gap-3 group shadow-sm">
      <button {...attributes} {...listeners} className="text-gray-400 hover:text-black mt-1 focus:outline-none"><GripVertical size={20} /></button>
      <div className="flex-1">
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wide">{addr.label}</span>
        <p className="mt-2 text-gray-800 font-medium whitespace-pre-wrap break-words">{addr.full_address}</p>
      </div>
      <button onClick={onDelete} className="text-red-400 hover:text-red-600 p-2 transition"><Trash2 size={18} /></button>
    </div>
  )
}
