import { createClient } from "@/lib/supabase/server"
import { InventoryInterface } from "@/components/inventory-interface"

export default async function InventarioPage() {
  const supabase = await createClient()

  const { data: products } = await supabase.from("products").select("*").order("name")

  return <InventoryInterface initialProducts={products || []} />
}
