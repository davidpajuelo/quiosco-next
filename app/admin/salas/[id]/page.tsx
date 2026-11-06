import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, asc, desc, eq, inArray, ne, or } from 'drizzle-orm'
import { PlusIcon } from '@heroicons/react/24/outline'
import OrderCard from '@/components/order/OrderCard'
import OrderSummary from '@/components/order/OrderSummary'
import RoomPlanView from '@/components/room/RoomPlanView'
import Heading from '@/components/ui/Heading'
import { db } from '@/src/db'
import { orderProducts, orders, roomElements, rooms } from '@/src/db/schema'
import { RoomIdSchema } from '@/src/schema'
import type { TableOrderStats } from '@/src/types'
import { formatCurrency } from '@/src/utils'
import { formatSelection, fromCents, parseSelection, remainingCents, toCents } from '@/src/utils/payments'

// Los pedidos cambian sin pasar por este panel (clientes desde el QR, webhook de Stripe)
export const dynamic = 'force-dynamic'

const HISTORY_LIMIT = 10
// Valores de ?cobrar=, además del id de una comanda:
// todos los pedidos Pendientes de pago de la mesa
const PAY_ALL = 'todo'
// Dividir Pago: elegir los productos sin pagar (los ya elegidos van en ?lineas=)
const SPLIT = 'dividir'
// Cobro de los productos de ?lineas=
const PAY_LINES = 'lineas'

type OrderSummaryProps = React.ComponentProps<typeof OrderSummary>

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

// Pedidos pendientes de una mesa: sin completar (los de Ordenes) o completados pero Pendientes de pago
const isPending = () => or(eq(orders.status, false), eq(orders.paymentStatus, 'pending'))

// Resumen de los pedidos pendientes de cada mesa, con el importe Pendiente de pago calculado
// descontando los Productos Pagados
async function getTableStats(codes: string[]): Promise<Record<string, TableOrderStats>> {
  if (codes.length === 0) return {}
  const rows = await db.query.orders.findMany({
    columns: { tableId: true, status: true, paymentStatus: true, total: true },
    where: and(inArray(orders.tableId, codes), isPending()),
    with: {
      orderProducts: {
        columns: { id: true, quantity: true, price: true, paid: true },
        where: eq(orderProducts.paid, true),
        with: { product: { columns: { price: true } } }
      }
    }
  })
  const stats: Record<string, TableOrderStats> = {}
  for (const row of rows) {
    const table = stats[row.tableId!] ??= { open: 0, unpaidCompleted: 0, unpaidTotal: 0 }
    if (!row.status) table.open++
    if (row.paymentStatus === 'pending') {
      if (row.status) table.unpaidCompleted++
      // Se suma en céntimos para no acumular errores de redondeo
      table.unpaidTotal = fromCents(toCents(table.unpaidTotal) + remainingCents(row))
    }
  }
  return stats
}

function getTableOrders(code: string) {
  return Promise.all([
    db.query.orders.findMany({
      where: and(eq(orders.tableId, code), isPending()),
      orderBy: [asc(orders.date)],
      with: {
        orderProducts: {
          // Las líneas nuevas de los pagos de una parte van detrás de la original
          orderBy: [asc(orderProducts.id)],
          with: {
            product: true
          }
        }
      }
    }),
    db.query.orders.findMany({
      columns: { id: true, name: true, total: true, date: true },
      // Los completados sin pagar ya salen en los pendientes
      where: and(eq(orders.tableId, code), eq(orders.status, true), ne(orders.paymentStatus, 'pending')),
      orderBy: [desc(orders.date)],
      limit: HISTORY_LIMIT
    })
  ])
}

type SalaPageProps = {
  params: { id: string }
  // cobrar: comanda Pendiente de pago que se está cobrando, PAY_ALL, SPLIT o PAY_LINES.
  // lineas: productos elegidos en Dividir Pago (ids separados por comas)
  searchParams: { mesa?: string, cobrar?: string, lineas?: string }
}

export default async function SalaPage({ params, searchParams }: SalaPageProps) {
  const room = await getRoom(params.id)
  if (!room) notFound()

  const codes = room.elements.flatMap(element => element.tableId ? [element.tableId] : [])
  const selectedCode = searchParams.mesa && codes.includes(searchParams.mesa) ? searchParams.mesa : null
  const [roomList, stats, [pendingOrders, history]] = await Promise.all([
    db.query.rooms.findMany({ columns: { id: true, name: true }, orderBy: [asc(rooms.id)] }),
    getTableStats(codes),
    selectedCode ? getTableOrders(selectedCode) : Promise.resolve([[], []] as const)
  ])
  const busyCodes = codes.filter(code => stats[code]).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))
  const roomUnpaidTotal = busyCodes.reduce((total, code) => total + Math.round(stats[code].unpaidTotal * 100), 0) / 100
  const selectedUnpaidTotal = selectedCode ? stats[selectedCode]?.unpaidTotal ?? 0 : 0
  const unpaidOrders = pendingOrders.filter(order => order.paymentStatus === 'pending')

  const elements = room.elements.map(({ id, tableId, kind, shape, x, y, width, height, rotation, label }) => ({
    id, kind, shape, x, y, width, height, rotation, label,
    code: tableId
  }))
  const roomPath = `/admin/salas/${room.id}`
  const tablePath = selectedCode ? `${roomPath}?mesa=${encodeURIComponent(selectedCode)}` : roomPath
  const splitPath = `${tablePath}&cobrar=${SPLIT}`

  // Productos de ?lineas= que siguen sin pagar en los pedidos Pendientes de pago de la mesa,
  // con la cantidad elegida (como mucho la que queda; sin cantidad, toda)
  const unpaidLines = new Map(unpaidOrders.flatMap(order => order.orderProducts.filter(line => !line.paid).map(line => [line.id, line.quantity])))
  const lines = parseSelection(searchParams.lineas).flatMap(({ id, quantity }) => {
    const available = unpaidLines.get(id)
    return available ? [{ id, quantity: Math.min(quantity ?? available, available) }] : []
  }).filter((line, index, all) => all.findIndex(other => other.id === line.id) === index)
  const lineIds = lines.map(line => line.id)

  // Pantalla de cobro abierta encima de los Pedidos pendientes, si la hay
  let payment: OrderSummaryProps['payment']
  let split: OrderSummaryProps['split']
  if (unpaidOrders.length > 0) {
    if (searchParams.cobrar === SPLIT) {
      split = {
        orders: unpaidOrders,
        selected: lines,
        pending: selectedUnpaidTotal,
        backHref: tablePath,
        selectHref: splitPath,
        payHref: `${tablePath}&cobrar=${PAY_LINES}`
      }
    } else if (searchParams.cobrar === PAY_LINES && lines.length > 0) {
      payment = {
        orders: unpaidOrders.filter(order => order.orderProducts.some(line => lineIds.includes(line.id))),
        lines,
        pending: selectedUnpaidTotal,
        // Volver atrás recupera la selección; al pagar se sigue dividiendo lo que queda
        backHref: `${splitPath}&lineas=${formatSelection(lines)}#pedido`,
        doneHref: splitPath
      }
    } else {
      const orders = searchParams.cobrar === PAY_ALL
        ? unpaidOrders
        : unpaidOrders.filter(order => String(order.id) === searchParams.cobrar)
      if (orders.length > 0) payment = { orders, backHref: tablePath }
    }
  }

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
          <RoomPlanView outline={room.outline} elements={elements} stats={stats} selectedCode={selectedCode} />
        </div>

        <aside className="lg:w-96 bg-white p-4 shadow self-start w-full space-y-4" aria-label="Pedidos de la mesa">
          {selectedCode ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-2xl font-bold">Mesa {selectedCode}</h2>
                <Link href={roomPath} scroll={false} className="text-sm underline">Cerrar</Link>
              </div>
              <div className={`flex flex-wrap items-center gap-2 rounded p-3 ${selectedUnpaidTotal > 0 ? 'bg-red-50 text-red-800' : 'bg-gray-100'}`}>
                <dl className="flex flex-1 min-w-48 items-center justify-between gap-2">
                  <dt className="font-bold">Pendiente de pago</dt>
                  <dd className="text-xl font-bold">{formatCurrency(selectedUnpaidTotal)}</dd>
                </dl>
                {unpaidOrders.length > 0 && !payment && !split && (
                  // Cobran con la misma pantalla que el Marcar como Pagado de cada comanda
                  <div className="flex gap-2">
                    <Link
                      href={`${tablePath}&cobrar=${PAY_ALL}#pedido`}
                      title="Marcar como pagado todo lo de la mesa"
                      className="py-2 px-3 rounded bg-green-600 hover:bg-green-700 text-white text-sm font-bold uppercase whitespace-nowrap"
                    >
                      Pagar todo
                    </Link>
                    <Link
                      href={`${splitPath}#pedido`}
                      title="Elegir los productos sin pagar que se pagan juntos"
                      className="py-2 px-3 rounded border-2 border-green-600 bg-white hover:bg-green-50 text-green-800 text-sm font-bold uppercase whitespace-nowrap"
                    >
                      Dividir Pago
                    </Link>
                  </div>
                )}
              </div>
              {payment || split ? (
                // Cobro encima de los Pedidos pendientes; Volver atrás (o el del navegador) regresa a ellos.
                // key: cada pantalla empieza con su propia selección e Importe entregado
                <OrderSummary key={`${searchParams.cobrar}|${searchParams.lineas ?? ''}`} payment={payment} split={split} />
              ) : (
                <>
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
                        <OrderCard order={order} payHref={`${tablePath}&cobrar=${order.id}#pedido`} />
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
              )}
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold">{room.name}</h2>
              <p className="text-sm text-gray-600">
                Pulsa una mesa o un taburete para ver sus pedidos y añadir uno nuevo.
                Las mesas en <span className="font-bold text-[#C65D3B]">rojo</span> tienen pedidos sin completar
                y el círculo <span className="font-bold text-red-600">rojo</span> de su esquina izquierda indica pedidos completados pendientes de pago.
              </p>
              {codes.length > 0 && (
                <dl className={`flex items-center justify-between gap-2 rounded p-3 ${roomUnpaidTotal > 0 ? 'bg-red-50 text-red-800' : 'bg-gray-100'}`}>
                  <dt className="font-bold">Pendiente de pago en la sala</dt>
                  <dd className="text-xl font-bold">{formatCurrency(roomUnpaidTotal)}</dd>
                </dl>
              )}
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
                      <Link href={`${roomPath}?mesa=${encodeURIComponent(code)}`} scroll={false} className="flex justify-between gap-2 py-2 hover:underline">
                        <span className="font-bold">Mesa {code}</span>
                        <span className="text-right">
                          {stats[code].open > 0 && <span className="block">{stats[code].open === 1 ? '1 pedido sin completar' : `${stats[code].open} pedidos sin completar`}</span>}
                          {stats[code].unpaidTotal > 0 && <span className="block font-bold text-red-700">{formatCurrency(stats[code].unpaidTotal)} pendiente de pago</span>}
                        </span>
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
