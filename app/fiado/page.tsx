import { createClient } from "@/lib/supabase/server"
import { CreditInterface } from "@/components/credit-interface"

export default async function FiadoPage() {
  const supabase = await createClient()

  const { data: customers } = await supabase.from("customers").select("*").order("name")

  const { data: payments } = await supabase
    .from("credit_payments")
    .select("*, customers(name)")
    .order("created_at", { ascending: false })
    .limit(50)

  return <CreditInterface initialCustomers={customers || []} initialPayments={payments || []} />
}
