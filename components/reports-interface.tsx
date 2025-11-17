"use client"

import { useState, useMemo } from "react"
import { Home, TrendingUp, DollarSign, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Product, Customer, Expense } from "@/lib/types"
import Link from "next/link"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ReportsInterfaceProps {
  sales: any[]
  expenses: Expense[]
  products: Product[]
  customers: Customer[]
}

interface ProductStats {
  quantity: number;
  revenue: number;
}

export function ReportsInterface({ sales, expenses, products, customers }: ReportsInterfaceProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [selectedDateRange, setSelectedDateRange] = useState<"day" | "week" | "month" | "all">("month")

  // Calculate date ranges
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0))
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  // Filter sales by selected month
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.created_at)

      if (selectedDateRange === "day") {
        return saleDate >= startOfDay
      } else if (selectedDateRange === "week") {
        return saleDate >= startOfWeek
      } else if (selectedDateRange === "month") {
        return sale.created_at.startsWith(selectedMonth)
      } else {
        return true
      }
    })
  }, [sales, selectedMonth, selectedDateRange])

  // Filter expenses by selected month
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.expense_date)

      if (selectedDateRange === "day") {
        return expenseDate >= startOfDay
      } else if (selectedDateRange === "week") {
        return expenseDate >= startOfWeek
      } else if (selectedDateRange === "month") {
        return expense.expense_date.startsWith(selectedMonth)
      } else {
        return true
      }
    })
  }, [expenses, selectedMonth, selectedDateRange])

  // Calculate sales metrics
  const totalSales = filteredSales.reduce((sum, s) => sum + s.total, 0)
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
  const profit = totalSales - totalExpenses
  const totalTransactions = filteredSales.length

  // Payment method breakdown
  const paymentMethodBreakdown = filteredSales.reduce(
    (acc, sale) => {
      acc[sale.payment_method] = (acc[sale.payment_method] || 0) + sale.total
      return acc
    },
    {} as Record<string, number>,
  )

  // Sales by payment status
  const pendingSales = filteredSales.filter((s) => s.payment_status === "pendiente")
  const totalPending = pendingSales.reduce((sum, s) => sum + s.total, 0)

  // Best selling products
  const productSales = filteredSales.flatMap((sale) => sale.sale_items || [])
  const productStats = productSales.reduce(
    (acc, item) => {
      const key = item.product_name
      if (!acc[key]) {
        acc[key] = { quantity: 0, revenue: 0 }
      }
      acc[key].quantity += item.quantity
      acc[key].revenue += item.subtotal
      return acc
    },
    {} as Record<string, ProductStats>,
  )
  const topProducts = Object.entries(productStats)
  .map(([product, stats]) => ({ 
    product, 
    stats: stats as { quantity: number; revenue: number } 
  }))
  .sort((a, b) => b.stats.revenue - a.stats.revenue)
  .slice(0, 10)

  // Daily sales trend
  const dailySales = filteredSales.reduce(
    (acc, sale) => {
      const date = new Date(sale.created_at).toLocaleDateString("es-MX")
      acc[date] = (acc[date] || 0) + sale.total
      return acc
    },
    {} as Record<string, number>,
  )

  const dailySalesArray = Object.entries(dailySales)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .slice(-7)

  // Customer debt summary
  const totalDebt = customers.reduce((sum, c) => sum + c.current_debt, 0)
  const customersWithDebt = customers.filter((c) => c.current_debt > 0)

  // Inventory value
  const inventoryValue = products.reduce((sum, p) => sum + p.stock * p.purchase_price, 0)
  const potentialRevenue = products.reduce((sum, p) => sum + p.stock * p.sale_price, 0)

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
            <h1 className="text-2xl font-bold">Reportes</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-4">
        {/* Date Range Selector */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="month-filter" className="text-base mb-2 block">
              Filtrar por período
            </Label>
            <div className="flex gap-2">
              <Button
                variant={selectedDateRange === "day" ? "default" : "outline"}
                onClick={() => setSelectedDateRange("day")}
              >
                Hoy
              </Button>
              <Button
                variant={selectedDateRange === "week" ? "default" : "outline"}
                onClick={() => setSelectedDateRange("week")}
              >
                Semana
              </Button>
              <Button
                variant={selectedDateRange === "month" ? "default" : "outline"}
                onClick={() => setSelectedDateRange("month")}
              >
                Mes
              </Button>
              <Button
                variant={selectedDateRange === "all" ? "default" : "outline"}
                onClick={() => setSelectedDateRange("all")}
              >
                Todo
              </Button>
            </div>
          </div>
          {selectedDateRange === "month" && (
            <div>
              <Label htmlFor="month-select" className="text-base mb-2 block">
                Seleccionar mes
              </Label>
              <Input
                id="month-select"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-10 text-base"
              />
            </div>
          )}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="sales">Ventas</TabsTrigger>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
            <TabsTrigger value="customers">Clientes</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Main Metrics */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ventas Totales</CardTitle>
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">${totalSales.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">{totalTransactions} transacciones</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Gastos Totales</CardTitle>
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">${totalExpenses.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">{filteredExpenses.length} gastos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ganancia</CardTitle>
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${profit >= 0 ? "text-primary" : "text-destructive"}`}>
                    ${profit.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((profit / totalSales) * 100 || 0).toFixed(1)}% margen
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pendiente de Pago</CardTitle>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">${totalPending.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">{pendingSales.length} ventas fiadas</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Métodos de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(paymentMethodBreakdown).map(([method, amount]) => (
                    <div key={method} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <div className="text-sm text-muted-foreground capitalize">{method}</div>
                        <div className="text-2xl font-bold">${(amount as number).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Daily Sales Trend */}
            {dailySalesArray.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Ventas Últimos 7 Días</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dailySalesArray.map(([date, amount]) => {
                      const maxAmount = Math.max(...dailySalesArray.map(([, a]) => a as number))
                      return (
                        <div key={date} className="flex items-center justify-between">
                          <div className="text-sm font-medium">{date}</div>
                          <div className="flex items-center gap-3">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{
                                width: `${((amount as number) / maxAmount) * 200}px`,
                                minWidth: "20px",
                              }}
                            />
                            <div className="text-lg font-bold w-24 text-right">${(amount as number).toFixed(2)}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Productos Más Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topProducts.map(({ product, stats }, index) => (
                    <div key={product} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold">{product}</div>
                          <div className="text-sm text-muted-foreground">{stats.quantity} unidades vendidas</div>
                        </div>
                      </div>
                      <div className="text-xl font-bold text-primary">${stats.revenue.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ventas Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {filteredSales.slice(0, 20).map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <div className="font-semibold">{sale.sale_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(sale.created_at).toLocaleString("es-MX")}
                          </div>
                          <Badge
                            variant={sale.payment_status === "pagado" ? "secondary" : "destructive"}
                            className="mt-1"
                          >
                            {sale.payment_status}
                          </Badge>
                        </div>
                        <div className="text-xl font-bold">${sale.total.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Valor del Inventario</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${inventoryValue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Costo de compra</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Valor Potencial</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">${potentialRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Si se vende todo</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Margen Potencial</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    ${(potentialRevenue - inventoryValue).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(((potentialRevenue - inventoryValue) / inventoryValue) * 100 || 0).toFixed(1)}% ganancia
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Productos con Bajo Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {products
                    .filter((p) => p.stock <= p.min_stock)
                    .sort((a, b) => a.stock - b.stock)
                    .map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between rounded-lg border border-destructive bg-destructive/10 p-3"
                      >
                        <div>
                          <div className="font-semibold">{product.name}</div>
                          <div className="text-sm text-muted-foreground">Mínimo: {product.min_stock}</div>
                        </div>
                        <Badge variant="destructive" className="text-lg">
                          {product.stock} en stock
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Total Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{customers.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Clientes con Deuda</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">{customersWithDebt.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Deuda Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">${totalDebt.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Clientes con Mayor Deuda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customers
                    .filter((c) => c.current_debt > 0)
                    .sort((a, b) => b.current_debt - a.current_debt)
                    .slice(0, 10)
                    .map((customer) => (
                      <div key={customer.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <div className="font-semibold">{customer.name}</div>
                          {customer.phone && <div className="text-sm text-muted-foreground">{customer.phone}</div>}
                        </div>
                        <div className="text-xl font-bold text-destructive">${customer.current_debt.toFixed(2)}</div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}