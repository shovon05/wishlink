import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Resend } from 'resend'

// ইমেইল HTML-এ ইউজারের দেওয়া টেক্সট বসানোর আগে escape করা (HTML injection ঠেকাতে)
function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(req: Request) {
  try {
    // ১. সিক্রেট হেডার ভেরিফাই করা (অননুমোদিত রিকোয়েস্ট ব্লক করতে)
    const secret = req.headers.get('x-webhook-secret')
    if (secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await req.json()

    // শুধুমাত্র INSERT ইভেন্টের জন্য কাজ করবে
    if (payload.type !== 'INSERT') {
      return NextResponse.json({ message: 'Ignored non-insert event' }, { status: 200 })
    }

    const { user_id, reservation_id, notification_type } = payload.record

    if (notification_type !== 'gift_reserved') {
      return NextResponse.json({ message: 'Ignored non-gift notification' }, { status: 200 })
    }

    // ২. Service Role Client দিয়ে Owner-এর ইমেইল বের করা (auth.users থেকে)
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id)
    if (userError || !userData?.user?.email) {
      throw new Error('User email not found')
    }

    // ৩. Reservation এবং Wishlist Item-এর তথ্য বের করা
    const { data: reservation, error: resError } = await supabaseAdmin
      .from('gift_reservations')
      .select('is_anonymous, gifter_contact, wishlist_items(title)')
      .eq('id', reservation_id)
      .single()

    if (resError || !reservation) {
      throw new Error('Reservation not found')
    }

    // @ts-ignore - Supabase nested fetch response type casting
    const itemTitle = escapeHtml(String(reservation.wishlist_items?.title || 'an item'))
    const gifterName = reservation.is_anonymous ? 'Someone' : escapeHtml(String(reservation.gifter_contact || 'Someone'))

    // ৪. Resend দিয়ে ইমেইল পাঠানো
    // বিঃদ্রঃ নিজের ভেরিফায়েড ডোমেইন যোগ করলে 'onboarding@resend.dev' পরিবর্তন করে নিজের ইমেইল (যেমন hello@yourdomain.com) দিতে হবে।
    // বর্তমানে 'onboarding@resend.dev' ব্যবহার করলে শুধুমাত্র Resend-এ আপনার রেজিস্টার করা ইমেইলেই মেইল যাবে।
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error: emailError } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: userData.user.email,
      subject: 'Someone wants to gift you something! 🎁',
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
          <h2>Great news! 🎉</h2>
          <p><strong>${gifterName}</strong> just reserved <strong>"${itemTitle}"</strong> from your wishlist!</p>
          <p>They are waiting for you to share a delivery address so they can send the gift.</p>
          <div style="margin-top: 24px;">
            <a href="${appUrl}/dashboard/notifications"
               style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              View Notification & Share Address
            </a>
          </div>
        </div>
      `,
    })

    if (emailError) {
      throw emailError
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error: any) {
    console.error('Webhook Error:', error.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
