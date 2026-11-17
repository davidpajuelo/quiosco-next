import { db } from "@/src/db"
import CategoryNav from "@/components/order/CategoryNav"
import CategoryTab from "@/components/order/CategoryTab"
import OrderSummary from "@/components/order/OrderSummary"
import CartButton from "@/components/ui/CartButton"
import ManualProductLink from "@/components/admin/ManualProductLink"
import { createAdminOrder } from "@/actions/create-order-actions"
import { KIOSK_PATH } from "@/src/kiosk-nav-store"

async function getCategories(){
  return await db.query.categories.findMany()
}

// El quiosco dentro del panel de administración; los pedidos van a la Mesa 0.
// -m-5 anula el padding del <main> del admin para que la barra ocupe todo el ancho
// y, en escritorio, el quiosco llene el hueco bajo la barra del admin con su propio scroll
// (100% del <main> + los 2.5rem del padding anulado)
export default async function AdminKioskLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const categories = await getCategories()
  return (
    <div className="-m-5 md:flex md:flex-col md:h-[calc(100%+2.5rem)]">
      {/* Al elegir una categoría se oculta; "Ver Quiosco" la vuelve a mostrar sin perder la categoría */}
      <CategoryNav collapsibleAt={KIOSK_PATH}>
        <ManualProductLink />
        {categories.map(category => (
          <CategoryTab
            key={category.id}
            category={category}
            basePath="/admin/quiosco"
          />
        ))}
      </CategoryNav>
      <div className="md:flex md:flex-1 md:min-h-0">
        <div className="md:flex-1 md:overflow-y-auto p-5">
          {children}
        </div>
        <OrderSummary submitOrder={createAdminOrder} alwaysVisible admin />
      </div>
      <CartButton alwaysVisible />
    </div>
  )
}
