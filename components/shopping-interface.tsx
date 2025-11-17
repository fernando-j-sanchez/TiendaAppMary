"use client"

import { useState, useEffect } from "react"
import { Home, Plus, Search, Trash2, Check, Phone, Mail, Building2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import type { ShoppingListItem, Supplier, Product } from "@/lib/types"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface ShoppingInterfaceProps {
  initialShoppingList: ShoppingListItem[]
  initialSuppliers: Supplier[]
  products: Product[]
}

export function ShoppingInterface({ initialShoppingList, initialSuppliers, products }: ShoppingInterfaceProps) {
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(initialShoppingList)
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>(initialSuppliers)
  const [showAddItemDialog, setShowAddItemDialog] = useState(false)
  const [showAddSupplierDialog, setShowAddSupplierDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Form state for shopping list item
  const [itemForm, setItemForm] = useState({
    product_id: "",
    product_name: "",
    quantity: "",
    priority: "normal",
    notes: "",
  })

  // Form state for supplier
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    products_supplied: "",
    notes: "",
  })

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.phone?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredSuppliers(filtered)
    } else {
      setFilteredSuppliers(suppliers)
    }
  }, [searchTerm, suppliers])

  const resetItemForm = () => {
    setItemForm({
      product_id: "",
      product_name: "",
      quantity: "",
      priority: "normal",
      notes: "",
    })
  }

  const resetSupplierForm = () => {
    setSupplierForm({
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      products_supplied: "",
      notes: "",
    })
  }

  const handleAddItem = async () => {
    if (!itemForm.product_name || !itemForm.quantity) {
      alert("Complete los campos obligatorios")
      return
    }

    setIsProcessing(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("shopping_list")
        .insert({
          product_id: itemForm.product_id || null,
          product_name: itemForm.product_name,
          quantity: Number.parseInt(itemForm.quantity),
          priority: itemForm.priority,
          notes: itemForm.notes || null,
          is_completed: false,
        })
        .select()
        .single()

      if (error) throw error

      setShoppingList([data, ...shoppingList])
      setShowAddItemDialog(false)
      resetItemForm()
      alert("Producto agregado a la lista")
    } catch (error) {
      console.error("[v0] Error al agregar producto:", error)
      alert("Error al agregar producto. Intente nuevamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleComplete = async (item: ShoppingListItem) => {
    const supabase = createClient()

    try {
      const newStatus = !item.is_completed
      const { data, error } = await supabase
        .from("shopping_list")
        .update({
          is_completed: newStatus,
          completed_at: newStatus ? new Date().toISOString() : null,
        })
        .eq("id", item.id)
        .select()
        .single()

      if (error) throw error

      setShoppingList(shoppingList.map((i) => (i.id === item.id ? data : i)))
    } catch (error) {
      console.error("[v0] Error al actualizar item:", error)
      alert("Error al actualizar item. Intente nuevamente.")
    }
  }

  const handleDeleteItem = async (item: ShoppingListItem) => {
    if (!confirm(`¿Eliminar "${item.product_name}" de la lista?`)) return

    const supabase = createClient()

    try {
      const { error } = await supabase.from("shopping_list").delete().eq("id", item.id)

      if (error) throw error

      setShoppingList(shoppingList.filter((i) => i.id !== item.id))
    } catch (error) {
      console.error("[v0] Error al eliminar item:", error)
      alert("Error al eliminar item. Intente nuevamente.")
    }
  }

  const handleAddSupplier = async () => {
    if (!supplierForm.name) {
      alert("Ingrese el nombre del proveedor")
      return
    }

    setIsProcessing(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("suppliers")
        .insert({
          name: supplierForm.name,
          contact_person: supplierForm.contact_person || null,
          phone: supplierForm.phone || null,
          email: supplierForm.email || null,
          address: supplierForm.address || null,
          products_supplied: supplierForm.products_supplied || null,
          notes: supplierForm.notes || null,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      setSuppliers([...suppliers, data])
      setShowAddSupplierDialog(false)
      resetSupplierForm()
      alert("Proveedor agregado exitosamente")
    } catch (error) {
      console.error("[v0] Error al agregar proveedor:", error)
      alert("Error al agregar proveedor. Intente nuevamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (!confirm(`¿Eliminar al proveedor "${supplier.name}"?`)) return

    const supabase = createClient()

    try {
      const { error } = await supabase.from("suppliers").delete().eq("id", supplier.id)

      if (error) throw error

      setSuppliers(suppliers.filter((s) => s.id !== supplier.id))
      alert("Proveedor eliminado")
    } catch (error) {
      console.error("[v0] Error al eliminar proveedor:", error)
      alert("Error al eliminar proveedor. Intente nuevamente.")
    }
  }

  const pendingItems = shoppingList.filter((item) => !item.is_completed)
  const completedItems = shoppingList.filter((item) => item.is_completed)
  const highPriorityItems = pendingItems.filter((item) => item.priority === "alta")

  // Auto-suggest items based on low stock
  const lowStockProducts = products.filter((p) => p.stock <= p.min_stock)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="lg">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Lista de Compras</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-4">
        <Tabs defaultValue="shopping-list" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="shopping-list" className="text-base">
              Lista de Compras
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="text-base">
              Proveedores
            </TabsTrigger>
          </TabsList>

          {/* Shopping List Tab */}
          <TabsContent value="shopping-list" className="space-y-6">
            {/* Alerts for low stock */}
            {lowStockProducts.length > 0 && (
              <Card className="border-destructive bg-destructive/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-6 w-6" />
                    {lowStockProducts.length} productos con stock bajo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 text-sm text-muted-foreground">
                    Considere agregar estos productos a su lista de compras
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {lowStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between rounded-lg bg-background p-3">
                        <div className="flex-1">
                          <div className="font-semibold">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Stock: {product.stock} / Min: {product.min_stock}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setItemForm({
                              product_id: product.id,
                              product_name: product.name,
                              quantity: String(product.min_stock * 2),
                              priority: "alta",
                              notes: "Stock bajo",
                            })
                            setShowAddItemDialog(true)
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Pendientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{pendingItems.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Prioridad Alta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">{highPriorityItems.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Completados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{completedItems.length}</div>
                </CardContent>
              </Card>
            </div>

            <Button
              size="lg"
              onClick={() => {
                resetItemForm()
                setShowAddItemDialog(true)
              }}
              className="w-full gap-2"
            >
              <Plus className="h-5 w-5" />
              Agregar a Lista de Compras
            </Button>

            {/* Pending Items */}
            {pendingItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Productos por Comprar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingItems.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-start justify-between rounded-lg border p-4 ${
                          item.priority === "alta" ? "border-destructive bg-destructive/10" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleComplete(item)}
                            className="mt-1"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <div className="flex-1">
                            <div className="font-semibold text-lg">{item.product_name}</div>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <Badge variant="secondary">Cantidad: {item.quantity}</Badge>
                              <Badge variant={item.priority === "alta" ? "destructive" : "outline"}>
                                {item.priority}
                              </Badge>
                            </div>
                            {item.notes && (
                              <div className="mt-2 text-sm italic text-muted-foreground">{item.notes}</div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Completed Items */}
            {completedItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Productos Comprados</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {completedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border p-3 opacity-60"
                        >
                          <div className="flex items-center gap-3">
                            <Check className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-semibold line-through">{item.product_name}</div>
                              <div className="text-sm text-muted-foreground">Cantidad: {item.quantity}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleToggleComplete(item)}>
                              Deshacer
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem(item)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar proveedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-14 pl-14 text-lg"
                />
              </div>
              <Button
                size="lg"
                onClick={() => {
                  resetSupplierForm()
                  setShowAddSupplierDialog(true)
                }}
                className="gap-2"
              >
                <Plus className="h-5 w-5" />
                Nuevo Proveedor
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSuppliers.map((supplier) => (
                <Card key={supplier.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          <span className="line-clamp-1">{supplier.name}</span>
                        </CardTitle>
                        {supplier.contact_person && (
                          <div className="mt-1 text-sm text-muted-foreground">{supplier.contact_person}</div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {supplier.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${supplier.phone}`} className="text-sm hover:underline">
                            {supplier.phone}
                          </a>
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${supplier.email}`} className="text-sm hover:underline">
                            {supplier.email}
                          </a>
                        </div>
                      )}
                      {supplier.products_supplied && (
                        <div>
                          <div className="text-sm font-semibold text-muted-foreground">Productos:</div>
                          <div className="text-sm">{supplier.products_supplied}</div>
                        </div>
                      )}
                      {supplier.address && <div className="text-sm text-muted-foreground">{supplier.address}</div>}
                      {supplier.notes && <div className="text-sm italic">{supplier.notes}</div>}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSupplier(supplier)}
                        className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredSuppliers.length === 0 && (
              <div className="py-12 text-center">
                <Building2 className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
                <p className="mt-4 text-lg text-muted-foreground">No se encontraron proveedores</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Agregar a Lista</DialogTitle>
            <DialogDescription>Producto que necesita comprar</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-select" className="text-base">
                Producto
              </Label>
              <Select
                value={itemForm.product_id}
                onValueChange={(value) => {
                  const product = products.find((p) => p.id === value)
                  setItemForm({
                    ...itemForm,
                    product_id: value,
                    product_name: product?.name || "",
                  })
                }}
              >
                <SelectTrigger id="product-select" className="h-12 text-base">
                  <SelectValue placeholder="Seleccionar producto existente" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id} className="text-base">
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-name" className="text-base">
                O escribir nombre del producto *
              </Label>
              <Input
                id="product-name"
                value={itemForm.product_name}
                onChange={(e) => setItemForm({ ...itemForm, product_name: e.target.value })}
                className="h-12 text-base"
                placeholder="Nombre del producto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-base">
                Cantidad *
              </Label>
              <Input
                id="quantity"
                type="number"
                value={itemForm.quantity}
                onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                className="h-12 text-base"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-base">
                Prioridad
              </Label>
              <Select
                value={itemForm.priority}
                onValueChange={(value) => setItemForm({ ...itemForm, priority: value })}
              >
                <SelectTrigger id="priority" className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja" className="text-base">
                    Baja
                  </SelectItem>
                  <SelectItem value="normal" className="text-base">
                    Normal
                  </SelectItem>
                  <SelectItem value="alta" className="text-base">
                    Alta
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base">
                Notas
              </Label>
              <Input
                id="notes"
                value={itemForm.notes}
                onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                className="h-12 text-base"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 text-base bg-transparent"
                onClick={() => setShowAddItemDialog(false)}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button className="flex-1 h-12 text-base" onClick={handleAddItem} disabled={isProcessing}>
                {isProcessing ? "Agregando..." : "Agregar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Supplier Dialog */}
      <Dialog open={showAddSupplierDialog} onOpenChange={setShowAddSupplierDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Nuevo Proveedor</DialogTitle>
            <DialogDescription>Información del proveedor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-name" className="text-base">
                Nombre del Proveedor *
              </Label>
              <Input
                id="supplier-name"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                className="h-12 text-base"
                placeholder="Ej: Distribuidora ABC"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-person" className="text-base">
                Persona de Contacto
              </Label>
              <Input
                id="contact-person"
                value={supplierForm.contact_person}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    contact_person: e.target.value,
                  })
                }
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-phone" className="text-base">
                Teléfono
              </Label>
              <Input
                id="supplier-phone"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-email" className="text-base">
                Email
              </Label>
              <Input
                id="supplier-email"
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-address" className="text-base">
                Dirección
              </Label>
              <Input
                id="supplier-address"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="products-supplied" className="text-base">
                Productos que Suministra
              </Label>
              <Textarea
                id="products-supplied"
                value={supplierForm.products_supplied}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    products_supplied: e.target.value,
                  })
                }
                className="text-base"
                placeholder="Ej: Bebidas, Snacks, Lacteos"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-notes" className="text-base">
                Notas
              </Label>
              <Textarea
                id="supplier-notes"
                value={supplierForm.notes}
                onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                className="text-base"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 text-base bg-transparent"
                onClick={() => setShowAddSupplierDialog(false)}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button className="flex-1 h-12 text-base" onClick={handleAddSupplier} disabled={isProcessing}>
                {isProcessing ? "Guardando..." : "Agregar Proveedor"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
