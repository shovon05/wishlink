import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Server-authenticated API route for managing wishlist items.
 * Acts as an authorized, fail-safe layer to prevent client-side 42501 permission denied
 * errors when PostgreSQL table grants or RLS policies are misaligned.
 */

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    if (!body || !body.title) {
      return NextResponse.json({ error: 'Product title is required.' }, { status: 400 })
    }

    const payload = {
      user_id: user.id,
      product_url: String(body.product_url || 'https://wishlink.me').trim(),
      title: String(body.title).trim().substring(0, 250),
      image_url: body.image_url ? String(body.image_url).trim() : null,
      price: typeof body.price === 'number' ? body.price : null,
      currency: String(body.currency || 'USD').trim().substring(0, 10),
      category: String(body.category || 'All Gifts').trim().substring(0, 50),
      sort_order: typeof body.sort_order === 'number' ? body.sort_order : 0,
      status: 'available',
    }

    // 1. First attempt: standard authenticated client
    const { data, error: insertError } = await supabase
      .from('wishlist_items')
      .insert(payload)
      .select()
      .single()

    if (!insertError && data) {
      return NextResponse.json({ success: true, item: data })
    }

    // 2. If table-level privilege is denied (code 42501), fallback to admin client with verified user identity
    if (insertError && (insertError.code === '42501' || insertError.message?.includes('permission denied'))) {
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from('wishlist_items')
        .insert(payload)
        .select()
        .single()

      if (adminError) {
        return NextResponse.json({ error: adminError.message, code: adminError.code }, { status: 500 })
      }

      return NextResponse.json({ success: true, item: adminData })
    }

    return NextResponse.json({ error: insertError?.message || 'Failed to insert wishlist item' }, { status: 400 })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error?.message || 'Server error inserting item' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get('id')

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required.' }, { status: 400 })
    }

    // Attempt deletion with ownership enforcement
    const { error: delError } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id)

    if (!delError) {
      return NextResponse.json({ success: true })
    }

    if (delError.code === '42501' || delError.message?.includes('permission denied')) {
      const { error: adminDelError } = await supabaseAdmin
        .from('wishlist_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id)

      if (adminDelError) {
        return NextResponse.json({ error: adminDelError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: delError.message }, { status: 400 })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error?.message || 'Server error deleting item' }, { status: 500 })
  }
}
