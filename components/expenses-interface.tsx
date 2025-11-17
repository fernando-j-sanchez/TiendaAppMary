"use client"

import { useState } from "react"
import { Home, Plus, Calendar, Trash2, Receipt, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import type { Expense } from "@/lib/types"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ExpensesInterfaceProps {
  initialExpenses: Expense[]
}

const EXPENSE_CATEGORIES = [
  "Compra de productos",
  "Servicios (Luz, Agua, Gas)",
  "Renta del local",
  "Salarios",
  "Transporte",
  "Mantenimiento",
  "Limpieza",
  "Impuestos",
  "Otros",
]

export function ExpensesInterface({ initialExpenses }: ExpensesInterfaceProps) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  // Form state
  const [formData, setFormData] = useState({
    description: "",
    category: "",
    amount: "",
    payment_method: "efectivo",
    expense_date: new Date().toISOString().split("T")[0],
    notes: "",
  })

  const resetForm = () => {
    setFormData({
      description: "",
      category: "",
      amount: "",
      payment_method: "efectivo",
      expense_date: new Date().toISOString().split("T")[0],
      notes: "",
    })
  }

  const handleAdd = async () => {
    if (!formData.description || !formData.category || !formData.amount) {
      alert("Complete los campos obligatorios")
      return
    }

    setIsProcessing(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("expenses")
        .insert({
          description: formData.description,
          category: formData.category,
          amount: Number.parseFloat(formData.amount),
          payment_method: formData.payment_method,
          expense_date: formData.expense_date,
          notes: formData.notes || null,
        })
        .select()
        .single()

      if (error) throw error

      setExpenses([data, ...expenses])
      setShowAddDialog(false)
      resetForm()
      alert("Gasto registrado exitosamente")
    } catch (error) {
      console.error("[v0] Error al registrar gasto:", error)
      alert("Error al registrar gasto. Intente nuevamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async (expense: Expense) => {
    if (!confirm(`¿Eliminar el gasto "${expense.description}"?`)) return

    const supabase = createClient()

    try {
      const { error } = await supabase.from("expenses").delete().eq("id", expense.id)

      if (error) throw error

      setExpenses(expenses.filter((e) => e.id !== expense.id))
      alert("Gasto eliminado")
    } catch (error) {
      console.error("[v0] Error al eliminar gasto:", error)
      alert("Error al eliminar gasto. Intente nuevamente.")
    }
  }

  // Filtrar gastos por mes
  const filteredExpenses = expenses.filter((expense) => expense.expense_date.startsWith(selectedMonth))

  // Calcular totales
  const totalMonth = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalByCategory = filteredExpenses.reduce(
    (acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    },
    {} as Record<string, number>,
  )

  // Calcular total general (todos los gastos)
  const totalGeneral = expenses.reduce((sum, e) => sum + e.amount, 0)

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
            <h1 className="text-2xl font-bold">Gastos</h1>
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
            Registrar Gasto
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-4">
        {/* Estadísticas */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Total General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">${totalGeneral.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Total del Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">${totalMonth.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Gastos Registrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{filteredExpenses.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtro por mes */}
        <div className="mb-6">
          <Label htmlFor="month-filter" className="text-base mb-2 block">
            Filtrar por mes
          </Label>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <Input
              id="month-filter"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-12 text-base max-w-xs"
            />
          </div>
        </div>

        {/* Resumen por categoría */}
        {Object.keys(totalByCategory).length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Gastos por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(totalByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => (
                    <div key={category} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="font-semibold">{category}</div>
                        <div className="text-sm text-muted-foreground">
                          {filteredExpenses.filter((e) => e.category === category).length} gastos
                        </div>
                      </div>
                      <div className="text-xl font-bold text-destructive">${amount.toFixed(2)}</div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de gastos */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {filteredExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-start justify-between rounded-lg border p-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <Receipt className="h-5 w-5 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <div className="font-semibold text-lg">{expense.description}</div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <Badge variant="secondary">{expense.category}</Badge>
                            <Badge variant="outline">{expense.payment_method}</Badge>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            {new Date(expense.expense_date).toLocaleDateString("es-MX", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                          {expense.notes && <div className="mt-2 text-sm italic">{expense.notes}</div>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-destructive">${expense.amount.toFixed(2)}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense)}
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredExpenses.length === 0 && (
                <div className="py-12 text-center">
                  <DollarSign className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
                  <p className="mt-4 text-lg text-muted-foreground">No hay gastos registrados para este mes</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo Agregar Gasto */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Registrar Gasto</DialogTitle>
            <DialogDescription>Complete la información del gasto</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base">
                Descripción *
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="h-12 text-base"
                placeholder="Ej: Pago de luz"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-base">
                Categoría *
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category" className="h-12 text-base">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-base">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-base">
                Monto *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="h-12 text-base"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method" className="text-base">
                Método de Pago
              </Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger id="payment-method" className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo" className="text-base">
                    Efectivo
                  </SelectItem>
                  <SelectItem value="tarjeta" className="text-base">
                    Tarjeta
                  </SelectItem>
                  <SelectItem value="transferencia" className="text-base">
                    Transferencia
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-date" className="text-base">
                Fecha del Gasto
              </Label>
              <Input
                id="expense-date"
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base">
                Notas
              </Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="h-12 text-base"
                placeholder="Notas adicionales"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 text-base bg-transparent"
                onClick={() => setShowAddDialog(false)}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button className="flex-1 h-12 text-base" onClick={handleAdd} disabled={isProcessing}>
                {isProcessing ? "Guardando..." : "Registrar Gasto"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
