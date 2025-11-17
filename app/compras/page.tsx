import { createClient } from "@/lib/supabase/server"
import { ShoppingInterface } from "@/components/shopping-interface"

export default async function ComprasPage() {
  const supabase = await createClient()

  const { data: shoppingList } = await supabase
    .from("shopping_list")
    .select("*")
    .order("is_completed")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })

  const { data: suppliers } = await supabase.from("suppliers").select("*").order("name")

  const { data: products } = await supabase.from("products").select("*").order("name")

  return (
    <ShoppingInterface
      initialShoppingList={shoppingList || []}
      initialSuppliers={suppliers || []}
      products={products || []}
    />
  )
}
