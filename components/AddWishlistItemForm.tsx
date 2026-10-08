'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['Electronics', 'Fashion', 'Books', 'Home', 'Other'];

export default function AddWishlistItemForm({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<{ title: string; image: string; price: string; category: string } | null>(null);

  const fetchDetails = async () => {
    const sanitizedUrl = url.trim();
    if (!sanitizedUrl) return;
    setLoading(true);
    try {
      const res = await fetch('/api/extract-metadata', {
        method: 'POST',
        body: JSON.stringify({ url: sanitizedUrl }),
      });
      const data = await res.json();

      setPreview({
        title: data.title || '',
        image: data.image || '',
        price: '',
        category: 'Other'
      });
    } catch (err) {
      setPreview({ title: '', image: '', price: '', category: 'Other' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview || !url) return;

    // স্যানিটাইজেশন এবং ভ্যালিডেশন
    const sanitizedUrl = url.trim();
    const sanitizedTitle = preview.title.trim().substring(0, 250); // ম্যাক্স ২৫০ অক্ষর
    const sanitizedPrice = preview.price.trim().substring(0, 50); // ম্যাক্স ৫০ অক্ষর

    if (!sanitizedUrl) return;

    setSaving(true);
    try {
      const { data: maxItem } = await supabase
        .from('wishlist_items')
        .select('sort_order')
        .eq('user_id', userId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      const nextSortOrder = maxItem ? maxItem.sort_order + 1 : 0;

      await supabase.from('wishlist_items').insert({
        user_id: userId,
        product_url: sanitizedUrl,
        title: sanitizedTitle,
        image_url: preview.image.trim(),
        price: sanitizedPrice,
        category: preview.category,
        sort_order: nextSortOrder,
      });

      setUrl('');
      setPreview(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700">Add New Item</h2>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          maxLength={1000}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste product URL here (https://...)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={fetchDetails}
          disabled={loading || !url.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Fetching...' : 'Fetch Details'}
        </button>
      </div>

      {preview && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col md:flex-row gap-6 items-start">
          {preview.image ? (
            <img src={preview.image} alt="Preview" className="w-32 h-32 object-cover rounded-md shadow-sm bg-white" />
          ) : (
            <div className="w-32 h-32 bg-gray-200 rounded-md flex items-center justify-center text-gray-400 text-sm">No Image</div>
          )}

          <div className="flex-1 space-y-3 w-full">
            <input
              type="text"
              maxLength={250}
              value={preview.title}
              onChange={(e) => setPreview({ ...preview, title: e.target.value })}
              placeholder="Product Title"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <div className="flex gap-4">
              <input
                type="text"
                maxLength={50}
                value={preview.price}
                onChange={(e) => setPreview({ ...preview, price: e.target.value })}
                placeholder="Price (e.g. $50)"
                className="w-1/2 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <select
                value={preview.category}
                onChange={(e) => setPreview({ ...preview, category: e.target.value })}
                className="w-1/2 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add to Wishlist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
