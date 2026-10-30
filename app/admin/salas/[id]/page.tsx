import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, asc, count, desc, eq, inArray } from 'drizzle-orm'
import { PlusIcon } from '@heroicons/react/24/outline'
import OrderCard from '@/components/order/OrderCard'
import RoomPlanView from '@/components/room/RoomPlanView'
import Heading from '@/components/ui/Heading'
import { db } from '@/src/db'
import { orders, roomElements, rooms } from '@/src/db/schema'
import { RoomIdSchema } from '@/src/schema'
import { formatCurrency } from '@/src/utils'

// Los pedidos cambian sin pasar por este panel (clientes desde el QR, webhook de Stripe)
export const dynamic = 'force-dynamic'

const HISTORY_LIMIT = 10

async function getRoom(id: string) {
  const roomId = RoomIdSchema.safeParse(id)
  if (!roomId.success) return null
  return db.query.rooms.findFirst({
    where: eq(rooms.id, roomId.data),
    with: {
      elements: { orderBy: [asc(roomElements.id)] }
    }
  })
}

// Pedidos sin completar de cada mesa, los mismos que salen en Ordenes
async function getPendingCounts(codes: string[]) {
  if (codes.length === 0) return {}
  const rows = await db.select({ tableId: orders.tableId, count: count() })
    .from(orders)
    .where(and(inArray(orders.tableId, codes), eq(orders.status, false)))
    .groupBy(orders.tableId)
  return Object.fromEntries(rows.map(row => [row.tableId!, row.count]))
}

function getTableOrders(code: string) {
  return Promise.all([
    db.query.orders.findMany({
      where: and(eq(orders.tableId, code), eq(orders.status, false)),
      orderBy: [asc(orders.date)],
      with: {
        orderProducts: {
          with: {
            product: true
          }
        }
      }
    }),
    db.query.orders.findMany({
      columns: { id: true, name: true, total: true, date: true },
      where: and(eq(orders.tableId, code), eq(orders.status, true)),
      orderBy: [desc(orders.date)],
      limit: HISTORY_LIMIT
    })
  ])
}

type SalaPageProps = {
  params: { id: string }
  searchParams: { mesa?: string }
}

export default async function SalaPage({ params, searchParams }: SalaPageProps) {
  const room = await getRoom(params.id)
  if (!room) notFound()

  const codes = room.elements.flatMap(element => element.tableId ? [element.tableId] : [])
  const selectedCode = searchParams.mesa && codes.includes(searchParams.mesa) ? searchParams.mesa : null
  const [roomList, pending, [pendingOrders, history]] = await Promise.all([
    db.query.rooms.findMany({ columns: { id: true, name: true }, orderBy: [asc(rooms.id)] }),
    getPendingCounts(codes),
    selectedCode ? getTableOrders(selectedCode) : Promise.resolve([[], []] as const)
  ])
  const busyCodes = codes.filter(code => pending[code]).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))

  const elements = room.elements.map(({ id, tableId, kind, shape, x, y, width, height, rotation, label }) => ({
    id, kind, shape, x, y, width, height, rotation, label,
    code: tableId
  }))
  const roomPath = `/admin/salas/${room.id}`

  return (
    <>
      <Heading>Salas</Heading>

      <nav className="flex flex-wrap gap-2 my-5" aria-label="Salas">
        {roomList.map(r => (
          <Link
            key={r.id}
            href={`/admin/salas/${r.id}`}
            aria-current={r.id === room.id ? 'page' : undefined}
            className={`py-2 px-5 rounded-full font-bold border ${r.id === room.id ? 'bg-primary border-transparent' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
          >
            {r.name}
          </Link>
        ))}
      </nav>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 h-[65vh] min-h-[420px] border border-gray-300 rounded overflow-hidden">
          <RoomPlanView outline={room.outline} elements={elements} pending={pending} selectedCode={selectedCode} />
        </div>

        <aside className="lg:w-96 bg-white p-4 shadow self-start w-full space-y-4" aria-label="Pedidos de la mesa">
          {selectedCode ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-2xl font-bold">Mesa {selectedCode}</h2>
                <Link href={roomPath} scroll={false} className="text-sm underline">Cerrar</Link>
              </div>
              <Link
                href={`${roomPath}/pedido/${encodeURIComponent(selectedCode)}`}
                className="flex items-center justify-center gap-2 py-3 rounded font-bold uppercase text-black bg-primary hover:bg-primary-dark w-full"
              >
                <PlusIcon className="size-5" aria-hidden="true" /> Añadir pedido
              </Link>

              <section className="space-y-2">
                <h3 className="text-lg font-bold">Pedidos pendientes ({pendingOrders.length})</h3>
                {pendingOrders.length === 0
                  ? <p className="text-sm text-gray-600">Esta mesa no tiene pedidos pendientes.</p>
                  : pendingOrders.map(order => (
                    <div key={order.id} className="border border-gray-200 rounded">
                      <OrderCard order={order} />
                    </div>
                  ))}
              </section>

              <section className="space-y-2 border-t border-gray-200 pt-4">
                <h3 className="text-lg font-bold">Últimos pedidos completados</h3>
                {history.length === 0 ? (
                  <p className="text-sm text-gray-600">Sin pedidos completados.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 text-sm">
                    {history.map(order => (
                      <li key={order.id} className="py-2 flex justify-between gap-2">
                        <span>
                          <span className="font-bold">Nº {order.id}</span> · {order.name || 'Sin nombre'}
                          <span className="block text-gray-600">{order.date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </span>
                        <span className="font-bold whitespace-nowrap">{formatCurrency(order.total)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold">{room.name}</h2>
              <p className="text-sm text-gray-600">
                Pulsa una mesa o un taburete para ver sus pedidos y añadir uno nuevo.
                Las mesas en <span className="font-bold text-[#C65D3B]">rojo</span> tienen pedidos pendientes.
              </p>
              {codes.length === 0 ? (
                <p className="text-sm">
                  Esta sala no tiene mesas. Añádelas en <Link href={`/admin/rooms/${room.id}`} className="font-bold underline">Crear/Editar Salas</Link>.
                </p>
              ) : busyCodes.length === 0 ? (
                <p className="text-sm">No hay pedidos pendientes en esta sala.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {busyCodes.map(code => (
                    <li key={code}>
                      <Link href={`${roomPath}?mesa=${encodeURIComponent(code)}`} scroll={false} className="flex justify-between py-2 hover:underline">
                        <span className="font-bold">Mesa {code}</span>
                        <span>{pending[code] === 1 ? '1 pedido' : `${pending[code]} pedidos`}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </aside>
      </div>
    </>
  )
}
