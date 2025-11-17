"use client"

import { useState, useEffect } from "react"
import { Home, Plus, Search, DollarSign, User, History, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import type { Customer } from "@/lib/types"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CreditInterfaceProps {
  initialCustomers: Customer[]
  initialPayments: any[]
}

export function CreditInterface({ initialCustomers, initialPayments }: CreditInterfaceProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [payments, setPayments] = useState(initialPayments)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(initialCustomers)
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Form state for customer
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    address: "",
    credit_limit: "",
    notes: "",
  })

  // Form state for payment
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_method: "efectivo",
    notes: "",
  })

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers(customers)
    }
  }, [searchTerm, customers])

  const resetCustomerForm = () => {
    setCustomerForm({
      name: "",
      phone: "",
      address: "",
      credit_limit: "",
      notes: "",
    })
  }

  const resetPaymentForm = () => {
    setPaymentForm({
      amount: "",
      payment_method: "efectivo",
      notes: "",
    })
  }

  const handleAddCustomer = async () => {
    if (!customerForm.name) {
      alert("Por favor ingrese el nombre del cliente")
      return
    }

    setIsProcessing(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("customers")
        .insert({
          name: customerForm.name,
          phone: customerForm.phone || null,
          address: customerForm.address || null,
          credit_limit: Number.parseFloat(customerForm.credit_limit) || 0,
          current_debt: 0,
          notes: customerForm.notes || null,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      setCustomers([...customers, data])
      setShowAddCustomerDialog(false)
      resetCustomerForm()
      alert("Cliente agregado exitosamente")
    } catch (error) {
      console.error("[v0] Error al agregar cliente:", error)
      alert("Error al agregar cliente. Intente nuevamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePayment = async () => {
    if (!selectedCustomer || !paymentForm.amount) {
      alert("Complete todos los campos")
      return
    }

    const amount = Number.parseFloat(paymentForm.amount)
    if (amount <= 0 || amount > selectedCustomer.current_debt) {
      alert("El monto debe ser mayor a 0 y no mayor a la deuda actual")
      return
    }

    setIsProcessing(true)
    const supabase = createClient()

    try {
      // Registrar pago
      const { data: payment, error: paymentError } = await supabase
        .from("credit_payments")
        .insert({
          customer_id: selectedCustomer.id,
          amount,
          payment_method: paymentForm.payment_method,
          notes: paymentForm.notes || null,
        })
        .select()
        .single()

      if (paymentError) throw paymentError

      // Actualizar deuda del cliente
      const newDebt = selectedCustomer.current_debt - amount
      const { error: updateError } = await supabase
        .from("customers")
        .update({ current_debt: newDebt })
        .eq("id", selectedCustomer.id)

      if (updateError) throw updateError

      // Actualizar estado local
      setCustomers(customers.map((c) => (c.id === selectedCustomer.id ? { ...c, current_debt: newDebt } : c)))

      // Agregar pago a la lista
      setPayments([{ ...payment, customers: { name: selectedCustomer.name } }, ...payments])

      setShowPaymentDialog(false)
      setSelectedCustomer(null)
      resetPaymentForm()
      alert(`Pago registrado: $${amount.toFixed(2)}`)
    } catch (error) {
      console.error("[v0] Error al registrar pago:", error)
      alert("Error al registrar pago. Intente nuevamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  const openPaymentDialog = (customer: Customer) => {
    setSelectedCustomer(customer)
    resetPaymentForm()
    setShowPaymentDialog(true)
  }

  const openHistoryDialog = async (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowHistoryDialog(true)
  }

  const totalDebt = customers.reduce((sum, c) => sum + c.current_debt, 0)
  const customersWithDebt = customers.filter((c) => c.current_debt > 0)
  const customersOverLimit = customers.filter((c) => c.current_debt > c.credit_limit && c.credit_limit > 0)

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
            <h1 className="text-2xl font-bold">Fiado (Créditos)</h1>
          </div>
          <Button
            size="lg"
            onClick={() => {
              resetCustomerForm()
              setShowAddCustomerDialog(true)
            }}
            className="gap-2"
          >
            <Plus className="h-5 w-5" />
            Nuevo Cliente
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-4">
        {/* Alertas */}
        {customersOverLimit.length > 0 && (
          <Card className="mb-6 border-destructive bg-destructive/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-6 w-6" />
                {customersOverLimit.length} clientes sobre su límite de crédito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {customersOverLimit.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between rounded-lg bg-background p-3">
                    <div>
                      <div className="font-semibold">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Debe: ${customer.current_debt.toFixed(2)} / Límite: ${customer.credit_limit.toFixed(2)}
                      </div>
                    </div>
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
              <CardTitle className="text-sm text-muted-foreground">Total Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{customers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Con Deuda</CardTitle>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Sobre Límite</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{customersOverLimit.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="customers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customers" className="text-base">
              Clientes
            </TabsTrigger>
            <TabsTrigger value="history" className="text-base">
              Historial de Pagos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="space-y-6">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-14 pl-14 text-lg"
              />
            </div>

            {/* Lista de clientes */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCustomers.map((customer) => (
                <Card
                  key={customer.id}
                  className={
                    customer.current_debt > customer.credit_limit && customer.credit_limit > 0
                      ? "border-destructive"
                      : ""
                  }
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          <span className="line-clamp-1">{customer.name}</span>
                        </CardTitle>
                        {customer.phone && <div className="mt-1 text-sm text-muted-foreground">{customer.phone}</div>}
                      </div>
                      {customer.current_debt > 0 && <Badge variant="destructive">Debe</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Deuda Actual</div>
                        <div
                          className={`text-3xl font-bold ${
                            customer.current_debt > 0 ? "text-destructive" : "text-primary"
                          }`}
                        >
                          ${customer.current_debt.toFixed(2)}
                        </div>
                      </div>

                      {customer.credit_limit > 0 && (
                        <div>
                          <div className="text-sm text-muted-foreground">Límite de Crédito</div>
                          <div className="text-lg font-semibold">${customer.credit_limit.toFixed(2)}</div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          className="flex-1"
                          onClick={() => openPaymentDialog(customer)}
                          disabled={customer.current_debt <= 0}
                        >
                          <DollarSign className="mr-2 h-4 w-4" />
                          Abonar
                        </Button>
                        <Button variant="outline" onClick={() => openHistoryDialog(customer)}>
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredCustomers.length === 0 && (
              <div className="py-12 text-center">
                <User className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
                <p className="mt-4 text-lg text-muted-foreground">No se encontraron clientes</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pagos Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {payments.map((payment: any) => (
                      <div key={payment.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <div className="font-semibold">{payment.customers?.name || "Cliente desconocido"}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(payment.created_at).toLocaleString("es-MX")}
                          </div>
                          <div className="text-sm text-muted-foreground">{payment.payment_method}</div>
                          {payment.notes && <div className="mt-1 text-sm italic">{payment.notes}</div>}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">${payment.amount.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Diálogo Agregar Cliente */}
      <Dialog open={showAddCustomerDialog} onOpenChange={setShowAddCustomerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Nuevo Cliente</DialogTitle>
            <DialogDescription>Agregar cliente para crédito (fiado)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name" className="text-base">
                Nombre del Cliente *
              </Label>
              <Input
                id="customer-name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                className="h-12 text-base"
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-phone" className="text-base">
                Teléfono
              </Label>
              <Input
                id="customer-phone"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                className="h-12 text-base"
                placeholder="Ej: 555-1234"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-address" className="text-base">
                Dirección
              </Label>
              <Input
                id="customer-address"
                value={customerForm.address}
                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-limit" className="text-base">
                Límite de Crédito
              </Label>
              <Input
                id="customer-limit"
                type="number"
                step="0.01"
                value={customerForm.credit_limit}
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    credit_limit: e.target.value,
                  })
                }
                className="h-12 text-base"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-notes" className="text-base">
                Notas
              </Label>
              <Input
                id="customer-notes"
                value={customerForm.notes}
                onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                className="h-12 text-base"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 text-base bg-transparent"
                onClick={() => setShowAddCustomerDialog(false)}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button className="flex-1 h-12 text-base" onClick={handleAddCustomer} disabled={isProcessing}>
                {isProcessing ? "Guardando..." : "Agregar Cliente"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo Registrar Pago */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Registrar Pago</DialogTitle>
            {selectedCustomer && (
              <DialogDescription className="text-lg">
                {selectedCustomer.name}
                <br />
                Deuda actual: ${selectedCustomer.current_debt.toFixed(2)}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount" className="text-base">
                Monto a Pagar *
              </Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="h-12 text-base"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-payment-method" className="text-base">
                Método de Pago
              </Label>
              <Select
                value={paymentForm.payment_method}
                onValueChange={(value) => setPaymentForm({ ...paymentForm, payment_method: value })}
              >
                <SelectTrigger id="payment-payment-method" className="h-12 text-base">
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
              <Label htmlFor="payment-notes" className="text-base">
                Notas
              </Label>
              <Input
                id="payment-notes"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                className="h-12 text-base"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 text-base bg-transparent"
                onClick={() => setShowPaymentDialog(false)}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button className="flex-1 h-12 text-base" onClick={handlePayment} disabled={isProcessing}>
                {isProcessing ? "Procesando..." : "Registrar Pago"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo Historial del Cliente */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Historial de {selectedCustomer?.name}</DialogTitle>
            {selectedCustomer && (
              <DialogDescription className="text-lg">
                Deuda actual: ${selectedCustomer.current_debt.toFixed(2)}
              </DialogDescription>
            )}
          </DialogHeader>
          <ScrollArea className="h-[400px] py-4">
            <div className="space-y-3 px-1">
              {selectedCustomer &&
                payments
                  .filter((p: any) => p.customer_id === selectedCustomer.id)
                  .map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(payment.created_at).toLocaleString("es-MX")}
                        </div>
                        <div className="text-sm">{payment.payment_method}</div>
                        {payment.notes && <div className="mt-1 text-sm italic">{payment.notes}</div>}
                      </div>
                      <div className="text-2xl font-bold text-primary">${payment.amount.toFixed(2)}</div>
                    </div>
                  ))}
              {selectedCustomer && payments.filter((p: any) => p.customer_id === selectedCustomer.id).length === 0 && (
                <div className="py-8 text-center text-muted-foreground">No hay pagos registrados</div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
