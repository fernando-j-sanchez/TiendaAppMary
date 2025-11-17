import { createClient } from "@/lib/supabase/server"
import { ReportsInterface } from "@/components/reports-interface"

export default async function ReportesPage() {
  const supabase = await createClient()

  // Get sales data
  const { data: sales } = await supabase
    .from("sales")
    .select("*, sale_items(*)")
    .order("created_at", { ascending: false })

  // Get expenses data
  const { data: expenses } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false })

  // Get products data
  const { data: products } = await supabase.from("products").select("*")

  // Get customers data
  const { data: customers } = await supabase.from("customers").select("*")

  return (
    <ReportsInterface
      sales={sales || []}
      expenses={expenses || []}
      products={products || []}
      customers={customers || []}
    />
  )
}
