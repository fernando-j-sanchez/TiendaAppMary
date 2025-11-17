import { createClient } from "@/lib/supabase/server"
import { POSInterface } from "@/components/pos-interface"

export default async function VentasPage() {
  const supabase = await createClient()

  // Obtener productos favoritos y activos para el grid principal
  const { data: favoriteProducts } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_favorite", true)
    .order("name")
    .limit(20)

  // Obtener todos los productos para búsqueda
  const { data: allProducts } = await supabase.from("products").select("*").eq("is_active", true).order("name")

  // Obtener clientes para fiado
  const { data: customers } = await supabase.from("customers").select("*").eq("is_active", true).order("name")

  return (
    <POSInterface
      favoriteProducts={favoriteProducts || []}
      allProducts={allProducts || []}
      customers={customers || []}
    />
  )
}
