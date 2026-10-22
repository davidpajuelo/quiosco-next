import { db } from "@/src/db"
import CategoryIcon from "@/components/ui/CategoryIcon"
import OrderSummary from "@/components/order/OrderSummary"
import CartButton from "@/components/ui/CartButton"
import ManualProductLink from "@/components/admin/ManualProductLink"
import { createAdminOrder } from "@/actions/create-order-actions"

async function getCategories(){
  return await db.query.categories.findMany()
}

// El quiosco dentro del panel de administración; los pedidos van a la Mesa 0
export default async function AdminKioskLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const categories = await getCategories()
  return (
    <div className="md:flex gap-5">
      <nav className="md:w-64 md:sticky md:top-0 md:self-start mb-5 md:mb-0">
        {categories.map(category => (
          <CategoryIcon
            key={category.id}
            category={category}
            basePath="/admin/quiosco"
          />
        ))}
        <ManualProductLink />
      </nav>
      <div className="md:flex-1">
        {children}
      </div>
      <div className="md:sticky md:top-0 md:self-start">
        <OrderSummary submitOrder={createAdminOrder} alwaysVisible admin />
      </div>
      <CartButton alwaysVisible />
    </div>
  )
}
