import { createClient } from '@/lib/supabase/server'
import SortableAddresses from '@/components/SortableAddresses'

export default async function AddressesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user!.id)
    .order('priority', { ascending: true })

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Delivery Addresses</h1>
        <p className="text-gray-500 mt-1">Manage where your gifts should be sent privately.</p>
      </div>

      <SortableAddresses initialAddresses={addresses || []} userId={user!.id} />
    </div>
  )
}
