import Link from "next/link"
import { notFound } from "next/navigation"
import { and, eq } from "drizzle-orm"
import { db } from "@/src/db"
import { roomElements, rooms } from "@/src/db/schema"
import { RoomIdSchema } from "@/src/schema"
import CategoryNav from "@/components/order/CategoryNav"
import CategoryTab from "@/components/order/CategoryTab"
import OrderSummary from "@/components/order/OrderSummary"
import CartButton from "@/components/ui/CartButton"
import ManualProductLink from "@/components/admin/ManualProductLink"
import TableOrderScope from "@/components/room/TableOrderScope"
import { createTableOrder } from "@/actions/create-order-actions"

// La mesa tiene que estar en el plano de esa sala
async function getTable(id: string, code: string) {
  const roomId = RoomIdSchema.safeParse(id)
  if (!roomId.success) return null
  const [table] = await db.select({ code: roomElements.tableId, room: rooms.name })
    .from(roomElements)
    .innerJoin(rooms, eq(roomElements.roomId, rooms.id))
    .where(and(eq(roomElements.roomId, roomId.data), eq(roomElements.tableId, code)))
  return table
}

type TableKioskLayoutProps = Readonly<{
  children: React.ReactNode
  params: { id: string, code: string }
}>

// El mismo quiosco de admin (/admin/quiosco), pero los pedidos van a la mesa elegida en el plano
export default async function TableKioskLayout({ children, params }: TableKioskLayoutProps) {
  // Los códigos solo llevan letras, números, - y _ (TableCodeSchema): van tal cual en la URL
  const { code } = params
  const [table, categories] = await Promise.all([getTable(params.id, code), db.query.categories.findMany()])
  if (!table) notFound()
  const basePath = `/admin/salas/${params.id}/pedido/${code}`

  return (
    <>
      <TableOrderScope code={code} />
      {/* Mismo esquema que /admin/quiosco: -m-5 anula el padding del <main> del admin y,
          en escritorio, el quiosco llena el hueco bajo la barra del admin con su propio scroll */}
      <div className="-m-5 md:flex md:flex-col md:h-[calc(100%+2.5rem)]">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-3 shadow">
          <p className="text-xl">
            Nuevo pedido para la <strong>Mesa {code}</strong> · {table.room}
          </p>
          <Link
            href={`/admin/salas/${params.id}?mesa=${code}`}
            className="py-2 px-6 rounded border-2 border-black font-bold uppercase"
          >
            ← Volver a la sala
          </Link>
        </div>
        <CategoryNav>
          <ManualProductLink href={`${basePath}/manual-product`} />
          {categories.map(category => (
            <CategoryTab
              key={category.id}
              category={category}
              basePath={basePath}
            />
          ))}
        </CategoryNav>
        <div className="md:flex md:flex-1 md:min-h-0">
          <div className="md:flex-1 md:overflow-y-auto p-5">
            {children}
          </div>
          <OrderSummary submitOrder={createTableOrder.bind(null, code)} alwaysVisible admin amountGiven={false} />
        </div>
        <CartButton alwaysVisible />
      </div>
    </>
  )
}
