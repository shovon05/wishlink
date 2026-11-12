import { createClient } from '@/lib/supabase/server'
import SortableAddresses from '@/components/SortableAddresses'
import { ShieldCheck } from 'lucide-react'

export default async function AddressesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user!.id)
    .order('priority', { ascending: true })

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink tracking-tight">
            Shipping Destinations
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
            Your residential addresses remain completely private until you explicitly disclose one for a reserved gift.
          </p>
        </div>

        <div className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-spruce-light text-spruce text-xs font-semibold border border-spruce/30 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Zero Public Exposure</span>
        </div>
      </div>

      <SortableAddresses initialAddresses={addresses || []} userId={user!.id} />
    </div>
  )
}
