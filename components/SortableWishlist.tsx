'use client';

import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SortableWishlist({ items: initialItems }: { items: any[] }) {
  const [items, setItems] = useState(initialItems);
  const supabase = createClient();
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over?.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems); // Optimistic UI update

      // DB-তে নতুন sort_order ব্যাচ আপডেট করা
      const updates = newItems.map((item, index) =>
        supabase.from('wishlist_items').update({ sort_order: index }).eq('id', item.id)
      );

      await Promise.all(updates);
      router.refresh();
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {items.map((item) => (
            <SortableItem key={item.id} item={item} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// ---------------- Individual Item Component ---------------- //
function SortableItem({ item }: { item: any }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const [isEditing, setIsEditing] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 group">
      {/* Drag Handle */}
      <button {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 focus:outline-none px-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {/* Image */}
      <img src={item.image_url || '/placeholder.png'} alt={item.title} className="w-20 h-20 object-cover rounded-lg bg-gray-100" />

      {/* Content / Edit Form */}
      {isEditing ? (
        <WishlistItemEditForm item={item} setIsEditing={setIsEditing} />
      ) : (
        <div className="flex-1">
          <a href={item.product_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-800 hover:text-blue-600 line-clamp-1">
            {item.title || 'Untitled Product'}
          </a>
          <p className="text-gray-500 text-sm mt-1">{item.category}{item.price ? <> • <span className="font-medium text-gray-900">{item.price}</span></> : null}</p>
        </div>
      )}

      {/* Actions (Edit/Delete or Badge) */}
      {!isEditing && <WishlistItemActions item={item} setIsEditing={setIsEditing} />}
    </div>
  );
}

// ---------------- Actions (Edit/Delete/Badge) ---------------- //
function WishlistItemActions({ item, setIsEditing }: { item: any; setIsEditing: (v: boolean) => void }) {
  const supabase = createClient();
  const router = useRouter();

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await supabase.from('wishlist_items').delete().eq('id', item.id);
      router.refresh();
    }
  };

  if (item.status === 'reserved' || item.status === 'gifted') {
    return (
      <div className="px-4 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200">
        🎁 {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
        Edit
      </button>
      <button onClick={handleDelete} className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
        Delete
      </button>
    </div>
  );
}

// ---------------- Inline Edit Form ---------------- //
function WishlistItemEditForm({ item, setIsEditing }: { item: any; setIsEditing: (v: boolean) => void }) {
  const supabase = createClient();
  const router = useRouter();
  const CATEGORIES = ['Electronics', 'Fashion', 'Books', 'Home', 'Other'];

  const [title, setTitle] = useState(item.title || '');
  const [price, setPrice] = useState(item.price || '');
  const [category, setCategory] = useState(item.category || '');
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    setSaving(true);
    await supabase.from('wishlist_items').update({ title, price, category }).eq('id', item.id);
    setIsEditing(false);
    router.refresh();
  };

  return (
    <div className="flex-1 flex gap-3 items-center">
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 px-2 py-1 text-sm border rounded" placeholder="Title" />
      <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} className="w-24 px-2 py-1 text-sm border rounded" placeholder="Price" />
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-28 px-2 py-1 text-sm border rounded">
        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
      </select>
      <button onClick={handleUpdate} disabled={saving} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">Save</button>
      <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-800 text-sm px-2">Cancel</button>
    </div>
  );
}
