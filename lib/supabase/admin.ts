import { createClient } from '@supabase/supabase-js'

// ⚠️ WARNING:
// এই ফাইলটি কখনোই কোনো ক্লায়েন্ট কম্পোনেন্টে (Client Components) ইম্পোর্ট করা যাবে না।
// এটি শুধুমাত্র সার্ভার সাইড কোডে (যেমন API routes বা Server Actions) ব্যবহার করতে হবে,
// কারণ এতে Service Role Key আছে যা RLS বাইপাস করে সম্পূর্ণ ডাটাবেস অ্যাক্সেস দেয়।

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
