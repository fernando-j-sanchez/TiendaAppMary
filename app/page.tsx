import Link from "next/link"
import { ShoppingCart, Package, Users, DollarSign, FileText, ClipboardList, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function HomePage() {
  const modules = [
    {
      title: "Vender",
      description: "Registrar ventas",
      icon: ShoppingCart,
      href: "/ventas",
      color: "bg-[oklch(0.55_0.18_145)] text-white hover:bg-[oklch(0.50_0.18_145)]",
    },
    {
      title: "Inventario",
      description: "Productos",
      icon: Package,
      href: "/inventario",
      color: "bg-[oklch(0.65_0.2_45)] text-white hover:bg-[oklch(0.60_0.2_45)]",
    },
    {
      title: "Fiado",
      description: "Créditos clientes",
      icon: Users,
      href: "/fiado",
      color: "bg-[oklch(0.65_0.15_220)] text-white hover:bg-[oklch(0.60_0.15_220)]",
    },
    {
      title: "Gastos",
      description: "Registrar gastos",
      icon: DollarSign,
      href: "/gastos",
      color: "bg-[oklch(0.75_0.18_85)] text-[oklch(0.145_0_0)] hover:bg-[oklch(0.70_0.18_85)]",
    },
    {
      title: "Reportes",
      description: "Ver ventas",
      icon: FileText,
      href: "/reportes",
      color: "bg-[oklch(0.58_0.2_290)] text-white hover:bg-[oklch(0.53_0.2_290)]",
    },
    {
      title: "Lista Compras",
      description: "Proveedores",
      icon: ClipboardList,
      href: "/compras",
      color: "bg-[oklch(0.68_0.18_340)] text-white hover:bg-[oklch(0.63_0.18_340)]",
    },
    
  ]

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-2xl bg-white p-6 text-center shadow-lg border-2 border-[oklch(0.90_0.01_240)]">
          <h1 className="text-4xl font-bold text-foreground md:text-5xl">La Tiendita de Doña Mary</h1>
          <p className="mt-2 text-xl text-[oklch(0.556_0_0)]">Sistema de Punto de Venta</p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <Link key={module.href} href={module.href}>
                <Card className="group cursor-pointer bg-white transition-all hover:shadow-2xl hover:scale-105">
                  <Button className={`h-auto w-full flex-col gap-4 p-8 ${module.color}`} size="lg">
                    <Icon className="h-16 w-16" />
                    <div className="text-center">
                      <div className="text-2xl font-bold">{module.title}</div>
                      <div className="mt-1 text-base opacity-90">{module.description}</div>
                    </div>
                  </Button>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
