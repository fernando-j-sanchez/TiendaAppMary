"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Search, Trash2, Plus, Minus, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import type { Product, Customer, CartItem } from "@/lib/types"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface POSInterfaceProps {
  favoriteProducts: Product[]
  allProducts: Product[]
  customers: Customer[]
}

export function POSInterface({ favoriteProducts, allProducts, customers }: POSInterfaceProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("efectivo")
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = allProducts.filter(
        (p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm),
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts([])
    }
  }, [searchTerm, allProducts])

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id)
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)))
      }
    } else {
      if (product.stock > 0) {
        setCart([...cart, { product, quantity: 1 }])
      }
    }
    setSearchTerm("")
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      const item = prevCart.find((i) => i.product.id === productId)
      if (!item) return prevCart

      const newQuantity = item.quantity + delta
      if (newQuantity <= 0) {
        return prevCart.filter((i) => i.product.id !== productId)
      }
      if (newQuantity > item.product.stock) {
        return prevCart
      }

      return prevCart.map((i) => (i.product.id === productId ? { ...i, quantity: newQuantity } : i))
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId))
  }

  const clearCart = () => {
    setCart([])
    setSelectedCustomer("")
  }

  const total = cart.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0)

  const handleCheckout = async () => {
    if (cart.length === 0) return

    setIsProcessing(true)
    const supabase = createClient()

    try {
      // Generar número de venta
      const saleNumber = `V-${Date.now()}`
      const paymentStatus = paymentMethod === "fiado" ? "pendiente" : "pagado"

      // Crear venta
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          sale_number: saleNumber,
          customer_id: selectedCustomer || null,
          total,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
        })
        .select()
        .single()

      if (saleError) throw saleError

      // Crear items de venta
      const saleItems = cart.map((item) => ({
        sale_id: sale.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.sale_price,
        subtotal: item.product.sale_price * item.quantity,
      }))

      const { error: itemsError } = await supabase.from("sale_items").insert(saleItems)

      if (itemsError) throw itemsError

      // Actualizar stock de productos
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from("products")
          .update({ stock: item.product.stock - item.quantity })
          .eq("id", item.product.id)

        if (stockError) throw stockError
      }

      // Si es fiado, actualizar deuda del cliente
      if (paymentMethod === "fiado" && selectedCustomer) {
        const customer = customers.find((c) => c.id === selectedCustomer)
        if (customer) {
          const { error: customerError } = await supabase
            .from("customers")
            .update({ current_debt: customer.current_debt + total })
            .eq("id", selectedCustomer)

          if (customerError) throw customerError
        }
      }

      // Limpiar carrito y cerrar diálogo
      clearCart()
      setShowCheckout(false)
      alert(`Venta registrada: ${saleNumber}\nTotal: $${total.toFixed(2)}`)

      // Recargar la página para actualizar inventario
      window.location.reload()
    } catch (error) {
      console.error("[v0] Error al procesar venta:", error)
      alert("Error al procesar la venta. Intente nuevamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="border-b-4 border-[oklch(0.50_0.18_145)] bg-[oklch(0.55_0.18_145)] px-4 py-3 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="lg" className="bg-white hover:bg-white/90">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">Punto de Venta</h1>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2 bg-white text-[oklch(0.55_0.18_145)] font-bold">
            {cart.length} productos
          </Badge>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Área de productos */}
        <div className="flex-1 overflow-y-auto bg-[oklch(0.98_0.005_264)] p-4">
          <div className="mx-auto max-w-6xl">
            {/* Buscador */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-[oklch(0.55_0.18_145)]" />
                <Input
                  type="text"
                  placeholder="Buscar producto por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-16 pl-14 text-xl bg-white border-2 border-[oklch(0.90_0.01_240)] focus:border-[oklch(0.55_0.18_145)]"
                />
              </div>

              {/* Resultados de búsqueda */}
              {searchTerm && filteredProducts.length > 0 && (
                <Card className="mt-2 bg-white shadow-lg">
                  <ScrollArea className="h-64">
                    <div className="p-2">
                      {filteredProducts.map((product) => (
                        <Button
                          key={product.id}
                          variant="ghost"
                          className="h-auto w-full justify-start p-4 text-left hover:bg-[oklch(0.95_0.01_240)]"
                          onClick={() => addToCart(product)}
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-lg">{product.name}</div>
                            <div className="text-muted-foreground">
                              ${product.sale_price.toFixed(2)} - Stock: {product.stock}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>
              )}
            </div>

            {/* Grid de productos favoritos */}
            <h2 className="mb-4 text-xl font-semibold">Productos Favoritos</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {favoriteProducts.map((product) => (
                <Button
                  key={product.id}
                  variant="outline"
                  className="h-auto flex-col gap-2 p-4 bg-white hover:bg-[oklch(0.55_0.18_145)] hover:text-white border-2 border-[oklch(0.55_0.18_145)] transition-all"
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                >
                  <div className="text-center">
                    <div className="font-semibold text-base line-clamp-2">{product.name}</div>
                    <div className="mt-1 text-lg font-bold">${product.sale_price.toFixed(2)}</div>
                    <Badge variant={product.stock > 5 ? "secondary" : "destructive"} className="mt-2">
                      Stock: {product.stock}
                    </Badge>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Panel de carrito */}
        <div className="w-full border-l-4 border-[oklch(0.55_0.18_145)] bg-white lg:w-96 shadow-xl">
          <div className="flex h-full flex-col">
            {/* Header del carrito */}
            <div className="border-b-2 border-[oklch(0.90_0.01_240)] bg-[oklch(0.95_0.01_240)] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6 text-[oklch(0.55_0.18_145)]" />
                  <h2 className="text-xl font-semibold">Carrito</h2>
                </div>
                {cart.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    Vaciar
                  </Button>
                )}
              </div>
            </div>

            {/* Items del carrito */}
            <ScrollArea className="flex-1 p-4 bg-white">
              {cart.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                  <div>
                    <ShoppingCart className="mx-auto h-16 w-16 mb-4 opacity-50" />
                    <p className="text-lg">Carrito vacío</p>
                    <p className="text-sm">Agrega productos para vender</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <Card key={item.product.id} className="bg-white shadow-md border-2 border-[oklch(0.90_0.01_240)]">
                      <CardContent className="p-3">
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold line-clamp-2">{item.product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              ${item.product.sale_price.toFixed(2)} c/u
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="bg-white"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-semibold">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.product.id, 1)}
                              disabled={item.quantity >= item.product.stock}
                              className="bg-white"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="font-bold text-[oklch(0.55_0.18_145)]">
                            ${(item.product.sale_price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Footer con total y botón de cobrar */}
            <div className="border-t-2 border-[oklch(0.90_0.01_240)] bg-[oklch(0.95_0.01_240)] p-4">
              <div className="mb-4 flex items-center justify-between text-2xl font-bold">
                <span>Total:</span>
                <span className="text-[oklch(0.55_0.18_145)]">${total.toFixed(2)}</span>
              </div>
              <Button
                className="h-14 w-full text-lg bg-[oklch(0.55_0.18_145)] hover:bg-[oklch(0.50_0.18_145)] text-white"
                size="lg"
                disabled={cart.length === 0}
                onClick={() => setShowCheckout(true)}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Cobrar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo de checkout */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">Procesar Venta</DialogTitle>
            <DialogDescription className="text-lg">Total a cobrar: ${total.toFixed(2)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment-method" className="text-base">
                Método de Pago
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method" className="h-12 text-base bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="efectivo" className="text-base">
                    Efectivo
                  </SelectItem>
                  <SelectItem value="tarjeta" className="text-base">
                    Tarjeta
                  </SelectItem>
                  <SelectItem value="transferencia" className="text-base">
                    Transferencia
                  </SelectItem>
                  <SelectItem value="fiado" className="text-base">
                    Fiado
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === "fiado" && (
              <div className="space-y-2">
                <Label htmlFor="customer" className="text-base">
                  Cliente
                </Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger id="customer" className="h-12 text-base bg-white">
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id} className="text-base">
                        {customer.name} - Debe: ${customer.current_debt.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 text-base bg-white hover:bg-[oklch(0.95_0.01_240)]"
                onClick={() => setShowCheckout(false)}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 h-12 text-base bg-[oklch(0.55_0.18_145)] hover:bg-[oklch(0.50_0.18_145)] text-white"
                onClick={handleCheckout}
                disabled={isProcessing || (paymentMethod === "fiado" && !selectedCustomer)}
              >
                {isProcessing ? "Procesando..." : "Confirmar Venta"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
