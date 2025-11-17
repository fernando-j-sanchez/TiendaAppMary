import { createClient } from "@/lib/supabase/server"
import { ExpensesInterface } from "@/components/expenses-interface"

export default async function GastosPage() {
  const supabase = await createClient()

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .order("expense_date", { ascending: false })
    .limit(100)

  return <ExpensesInterface initialExpenses={expenses || []} />
}
