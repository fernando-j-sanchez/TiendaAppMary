"use client"

import { useState, useEffect } from "react"
import { Home, Plus, Search, Edit, Trash2, Star, Package, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { Product } from "@/lib/types"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface InventoryInterfaceProps {
  initialProducts: Product[]
}

export function InventoryInterface({ initialProducts }: InventoryInterfaceProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    description: "",
    purchase_price: "",
    sale_price: "",
    stock: "",
    min_stock: "5",
    category: "",
    unit: "pieza",
    is_active: true,
    is_favorite: false,
  })

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [searchTerm, products])

  const resetForm = () => {
    setFormData({
      barcode: "",
      name: "",
      description: "",
      purchase_price: "",
      sale_price: "",
      stock: "",
      min_stock: "5",
      category: "",
      unit: "pieza",
      is_active: true,
      is_favorite: false,
    })
  }

  const handleAdd = async () => {
    if (!formData.name || !formData.sale_price) {
      alert("Por favor complete los campos obligatorios")
      return
    }

    setIsProcessing(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("products")
        .insert({
          barcode: formData.barcode || null,
          name: formData.name,
          description: formData.description || null,
          purchase_price: Number.parseFloat(formData.purchase_price) || 0,
          sale_price: Number.parseFloat(formData.sale_price),
          stock: Number.parseInt(formData.stock) || 0,
          min_stock: Number.parseInt(formData.min_stock) || 5,
          category: formData.category || null,
          unit: formData.unit,
          is_active: formData.is_active,
          is_favorite: formData.is_favorite,
        })
        .select()
        .single()

      if (error) throw error

      setProducts([...products, data])
      setShowAddDialog(false)
      resetForm()
      alert("Producto agregado exitosamente")
    } catch (error) {
      console.error("[v0] Error al agregar producto:", error)
      alert("Error al agregar producto. Intente nuevamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedProduct) return

    setIsProcessing(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("products")
        .update({
          barcode: formData.barcode || null,
          name: formData.name,
          description: formData.description || null,
          purchase_price: Number.parseFloat(formData.purchase_price) || 0,
          sale_price: Number.parseFloat(formData.sale_price),
          stock: Number.parseInt(formData.stock) || 0,
          min_stock: Number.parseInt(formData.min_stock) || 5,
          category: formData.category || null,
          unit: formData.unit,
          is_active: formData.is_active,
          is_favorite: formData.is_favorite,
        })
        .eq("id", selectedProduct.id)
        .select()
        .single()

      if (error) throw error

      setProducts(products.map((p) => (p.id === selectedProduct.id ? data : p)))
      setShowEditDialog(false)
      setSelectedProduct(null)
      resetForm()
      alert("Producto actualizado exitosamente")
    } catch (error) {
      console.error("[v0] Error al actualizar producto:", error)
      alert("Error al actualizar producto. Intente nuevamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Eliminar el producto "${product.name}"?`)) return

    const supabase = createClient()

    try {
      const { error } = await supabase.from("products").delete().eq("id", product.id)

      if (error) throw error

      setProducts(products.filter((p) => p.id !== product.id))
      alert("Producto eliminado")
    } catch (error) {
      console.error("[v0] Error al eliminar producto:", error)
      alert("Error al eliminar producto. Intente nuevamente.")
    }
  }

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      barcode: product.barcode || "",
      name: product.name,
      description: product.description || "",
      purchase_price: product.purchase_price.toString(),
      sale_price: product.sale_price.toString(),
      stock: product.stock.toString(),
      min_stock: product.min_stock.toString(),
      category: product.category || "",
      unit: product.unit,
      is_active: product.is_active,
      is_favorite: product.is_favorite,
    })
    setShowEditDialog(true)
  }

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
            <h1 className="text-2xl font-bold">Inventario</h1>
          </div>
          <Button
            size="lg"
            onClick={() => {
              resetForm()
              setShowAddDialog(true)
            }}
            className="gap-2"
          >
            <Plus className="h-5 w-5" />
            Agregar Producto
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-4">
        {/* Alertas de stock bajo */}
        {lowStockProducts.length > 0 && (
          <Card className="mb-6 border-destructive bg-destructive/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                {lowStockProducts.length} productos con stock bajo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between rounded-lg bg-background p-3">
                    <div>
                      <div className="font-semibold">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Stock: {product.stock} / Min: {product.min_stock}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estadísticas */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Total Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Productos Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{products.filter((p) => p.is_active).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Stock Bajo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{lowStockProducts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Favoritos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{products.filter((p) => p.is_favorite).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Buscador */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 pl-14 text-lg"
            />
          </div>
        </div>

        {/* Lista de productos */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {product.is_favorite && <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />}
                      <span className="line-clamp-1">{product.name}</span>
                    </CardTitle>
                    {product.category && (
                      <Badge variant="secondary" className="mt-2">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                  {!product.is_active && <Badge variant="destructive">Inactivo</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {product.barcode && <div className="text-sm text-muted-foreground">Código: {product.barcode}</div>}
                  {product.description && <div className="text-sm line-clamp-2">{product.description}</div>}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Precio Venta</div>
                      <div className="text-2xl font-bold text-primary">${product.sale_price.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Stock</div>
                      <div
                        className={`text-2xl font-bold ${
                          product.stock <= product.min_stock ? "text-destructive" : "text-foreground"
                        }`}
                      >
                        {product.stock}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 bg-transparent" onClick={() => openEditDialog(product)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
                      onClick={() => handleDelete(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-12 text-center">
            <Package className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
            <p className="mt-4 text-lg text-muted-foreground">No se encontraron productos</p>
          </div>
        )}
      </div>

      {/* Diálogo Agregar Producto */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Agregar Producto</DialogTitle>
            <DialogDescription>Complete la información del nuevo producto</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-base">
                Nombre del Producto *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-12 text-base"
                placeholder="Ej: Coca Cola 600ml"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="barcode" className="text-base">
                Código de Barras
              </Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="h-12 text-base"
                placeholder="Escanear o escribir código"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-base">
                Descripción
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="h-12 text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category" className="text-base">
                  Categoría
                </Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="h-12 text-base"
                  placeholder="Ej: Bebidas"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="unit" className="text-base">
                  Unidad
                </Label>
                <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                  <SelectTrigger id="unit" className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pieza">Pieza</SelectItem>
                    <SelectItem value="kg">Kilogramo</SelectItem>
                    <SelectItem value="litro">Litro</SelectItem>
                    <SelectItem value="paquete">Paquete</SelectItem>
                    <SelectItem value="caja">Caja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="purchase_price" className="text-base">
                  Precio Compra
                </Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  className="h-12 text-base"
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sale_price" className="text-base">
                  Precio Venta *
                </Label>
                <Input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  className="h-12 text-base"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="stock" className="text-base">
                  Stock Inicial
                </Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="h-12 text-base"
                  placeholder="0"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="min_stock" className="text-base">
                  Stock Mínimo
                </Label>
                <Input
                  id="min_stock"
                  type="number"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                  className="h-12 text-base"
                  placeholder="5"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                />
                <Label htmlFor="is_active" className="text-base">
                  Producto Activo
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_favorite"
                  checked={formData.is_favorite}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      is_favorite: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="is_favorite" className="text-base">
                  Producto Favorito
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isProcessing} className="h-12">
              Cancelar
            </Button>
            <Button onClick={handleAdd} disabled={isProcessing} className="h-12">
              {isProcessing ? "Guardando..." : "Agregar Producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Editar Producto */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Editar Producto</DialogTitle>
            <DialogDescription>Modifique la información del producto</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name" className="text-base">
                Nombre del Producto *
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-12 text-base"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-barcode" className="text-base">
                Código de Barras
              </Label>
              <Input
                id="edit-barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="h-12 text-base"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description" className="text-base">
                Descripción
              </Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="h-12 text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category" className="text-base">
                  Categoría
                </Label>
                <Input
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="h-12 text-base"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-unit" className="text-base">
                  Unidad
                </Label>
                <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                  <SelectTrigger id="edit-unit" className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pieza">Pieza</SelectItem>
                    <SelectItem value="kg">Kilogramo</SelectItem>
                    <SelectItem value="litro">Litro</SelectItem>
                    <SelectItem value="paquete">Paquete</SelectItem>
                    <SelectItem value="caja">Caja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-purchase_price" className="text-base">
                  Precio Compra
                </Label>
                <Input
                  id="edit-purchase_price"
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  className="h-12 text-base"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-sale_price" className="text-base">
                  Precio Venta *
                </Label>
                <Input
                  id="edit-sale_price"
                  type="number"
                  step="0.01"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  className="h-12 text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-stock" className="text-base">
                  Stock Actual
                </Label>
                <Input
                  id="edit-stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="h-12 text-base"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-min_stock" className="text-base">
                  Stock Mínimo
                </Label>
                <Input
                  id="edit-min_stock"
                  type="number"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                  className="h-12 text-base"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                />
                <Label htmlFor="edit-is_active" className="text-base">
                  Producto Activo
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-is_favorite"
                  checked={formData.is_favorite}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      is_favorite: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="edit-is_favorite" className="text-base">
                  Producto Favorito
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isProcessing} className="h-12">
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={isProcessing} className="h-12">
              {isProcessing ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
