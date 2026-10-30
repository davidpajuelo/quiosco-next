import Link from "next/link"
import { notFound } from "next/navigation"
import { and, eq } from "drizzle-orm"
import { db } from "@/src/db"
import { roomElements, rooms } from "@/src/db/schema"
import { RoomIdSchema } from "@/src/schema"
import CategoryIcon from "@/components/ui/CategoryIcon"
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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded bg-white p-4 shadow">
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
      <div className="md:flex gap-5">
        <nav className="md:w-64 md:sticky md:top-0 md:self-start mb-5 md:mb-0">
          {categories.map(category => (
            <CategoryIcon
              key={category.id}
              category={category}
              basePath={basePath}
            />
          ))}
          <ManualProductLink href={`${basePath}/manual-product`} />
        </nav>
        <div className="md:flex-1">
          {children}
        </div>
        <div className="md:sticky md:top-0 md:self-start">
          <OrderSummary submitOrder={createTableOrder.bind(null, code)} alwaysVisible admin />
        </div>
        <CartButton alwaysVisible />
      </div>
    </>
  )
}
