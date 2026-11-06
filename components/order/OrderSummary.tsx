"use client"
import Link from 'next/link'
import { useStore } from '@/src/store'
import { useParams, useRouter } from 'next/navigation'
import { toast} from 'react-toastify'
import React, { useMemo, useState } from 'react'
import ProductDetails from './ProductDetails'
import { formatCurrency } from '@/src/utils'
import { createOrder } from '@/actions/create-order-actions'
import { markLinesPaid, markOrdersPaid } from '@/actions/complete-order.actions'
import { AdminOrderSchema, OrderPaymentSchema, OrderSchema, TableOrderSchema } from '@/src/schema'
import type { OrderItem, OrderWithProducts } from '@/src/types'
import AmountGiven from '@/components/admin/AmountGiven'
import { chargeCents, formatSelection, fromCents, linePrice, linesToPay, toCents, type LineSelection } from '@/src/utils/payments'
import { toPrice } from '@/components/admin/KeyManual'

type OrderSummaryProps = {
  // Acción que crea el pedido; el panel de administración usa la de la Mesa 0
  submitOrder?: typeof createOrder
  // Mostrar el pedido aunque no haya categoría en la URL (p. ej. producto manual del admin)
  alwaysVisible?: boolean
  // Pedido desde el admin: nombre opcional
  admin?: boolean
  // Solo pedidos del admin. Se cobra al momento (quiosco): Importe entregado obligatorio y vueltas.
  // Sin él (mesas de las salas) el pedido queda Pendiente de pago
  amountGiven?: boolean
  // Cobro de pedidos ya hechos y Pendientes de pago (Salas): una comanda, todas las de la mesa o
  // lo elegido en Dividir Pago (lines). Sus productos no se pueden cambiar, se pide el Importe
  // entregado y se marcan como Pagados. backHref vuelve a la pantalla anterior y doneHref
  // (por defecto backHref) es adónde se va al pagar. pending: Pendiente de pago de la mesa
  payment?: { orders: OrderWithProducts[], lines?: LineQuantity[], pending?: number, backHref: string, doneHref?: string }
  // Dividir Pago: se eligen productos sin pagar de los pedidos de la mesa, y cuántos de cada uno,
  // y se va a su cobro. selectHref y payHref terminan en la query y se les añade &lineas=<selección>
  split?: { orders: OrderWithProducts[], selected: LineQuantity[], pending: number, backHref: string, selectHref: string, payHref: string }
}

// Línea de pedido y cantidad que se paga de ella
type LineQuantity = { id: number, quantity: number }

// Productos sin pagar de los pedidos con la forma de las líneas del carrito: lo elegido,
// o todo lo que queda sin selección
function unpaidLines(orders: OrderWithProducts[], selection: LineSelection | null) {
  return orders.flatMap(order => linesToPay(order.orderProducts, selection).map(({ line, quantity }) => {
    const price = linePrice(line)
    const item: OrderItem = {
      id: line.id,
      name: line.product?.name ?? line.name ?? '',
      price,
      quantity,
      subtotal: price * quantity
    }
    return item
  }))
}

// Producto fusionado y las líneas de pedido que lo forman, en el orden de las comandas
type ItemGroup = { item: OrderItem, lines: LineQuantity[] }

// El mismo producto al mismo precio se junta en una línea sumando las cantidades, como en una
// cuenta, aunque venga de varias comandas
function mergeItems(items: OrderItem[]): ItemGroup[] {
  const merged = new Map<string, ItemGroup>()
  for (const item of items) {
    const key = `${item.name}|${item.price}`
    const line = { id: item.id, quantity: item.quantity }
    const group = merged.get(key)
    if (group) {
      group.item.quantity += item.quantity
      group.item.subtotal = group.item.price * group.item.quantity
      group.lines.push(line)
    } else {
      merged.set(key, { item: { ...item }, lines: [line] })
    }
  }
  return Array.from(merged.values())
}

// Lo que se cobra de esos pedidos teniendo en cuenta sus Productos Pagados
function chargeTotal(orders: OrderWithProducts[], selection: LineSelection | null) {
  return fromCents(orders.reduce((sum, order) => sum + chargeCents(order, selection), 0))
}

const toSelection = (lines: LineQuantity[]): LineSelection => new Map(lines.map(line => [line.id, line.quantity]))

export default function OrderSummary({ submitOrder = createOrder, alwaysVisible = false, admin = false, amountGiven: withAmountGiven = admin, payment, split }: OrderSummaryProps) {
  const cart = useStore((state) => state.order)
  const clearOrder = useStore((state) => state.clearOrder)
  const router = useRouter()
  const [amountGiven, setAmountGiven] = useState('')
  // Dividir Pago: cuántos se pagan de cada producto elegido
  const [selected, setSelected] = useState(() => toSelection(split?.selected ?? []))
  // Solo hay categoría en la URL cuando el usuario ha pulsado una
  const { category } = useParams<{ category?: string }>()
  const visible = alwaysVisible || !!payment || !!split || !!category
  const paymentSelection = useMemo(() => payment?.lines ? toSelection(payment.lines) : null, [payment])
  // Dividir Pago: los productos sin pagar de todas las comandas, fusionados
  const splitGroups = useMemo(() => split ? mergeItems(unpaidLines(split.orders, null)) : [], [split])
  // Al cobrar se muestra lo que queda por pagar de los pedidos guardados, no el carrito
  const order = useMemo(() => payment
    ? mergeItems(unpaidLines(payment.orders, paymentSelection)).map(group => group.item)
    : split ? splitGroups.map(group => group.item) : cart,
  [payment, paymentSelection, split, splitGroups, cart])
  const cartTotal = useMemo(() => cart.reduce((total, item) => total + (item.quantity * item.price), 0), [cart])
  const total = payment ? chargeTotal(payment.orders, paymentSelection)
    : split ? chargeTotal(split.orders, selected)
    : cartTotal
  const payingOne = payment && !payment.lines && payment.orders.length === 1 ? payment.orders[0] : null
  // Dividir Pago: Pendiente de la mesa y lo que quedará tras este pago
  const pending = split?.pending ?? payment?.pending
  const pendingAfter = pending === undefined ? 0 : fromCents(Math.max(0, toCents(pending) - toCents(total)))
  const tableId = (payment ?? split)?.orders[0]?.tableId
  const showAmountGiven = !!payment || (admin && withAmountGiven)
  const amountGivenValue = amountGiven === '' ? undefined : toPrice(amountGiven)
  const handleCreateOrder = async (formData: FormData) => {
    const data = {
      name: formData.get('name'),
      total,
      order,
      ...(admin && withAmountGiven && { amountGiven: amountGivenValue })
    }
    const schema = !admin ? OrderSchema : withAmountGiven ? AdminOrderSchema : TableOrderSchema
    const result = schema.safeParse(data)
    
    if (! result.success) {
      result.error.issues.forEach((issue) => {
        toast.error(issue.message)
      })

      return
    }
   
    const response = await submitOrder(data)
    if ('errors' in response) {
        response.errors.forEach((issue) => {
          toast.error(issue.message)
        })
        return
    }
    // Pedido de cliente: redirige al Checkout alojado de Stripe
    if ('url' in response) {
      window.location.assign(response.url)
      return
    }
    // Pedido del admin: ya está creado, sin pasarela (cobrado en el quiosco o pendiente de pago en la mesa)
    toast.success(`Pedido ${response.orderId} creado`)
    clearOrder()
    setAmountGiven('')
  }
  // Marca como Pagado lo que se cobra y vuelve a la pantalla anterior
  const handlePayOrder = async () => {
    if (!payment) return
    const result = OrderPaymentSchema.safeParse({ total, amountGiven: amountGivenValue })
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        toast.error(issue.message)
      })
      return
    }
    const response = payment.lines
      ? await markLinesPaid(payment.lines, result.data.amountGiven)
      : await markOrdersPaid(payment.orders.map(item => item.id), result.data.amountGiven)
    if ('errors' in response) {
      response.errors.forEach((issue) => {
        toast.error(issue.message)
      })
      return
    }
    toast.success(payment.lines
      ? `${formatCurrency(total)} de la Mesa ${tableId} pagados`
      : payingOne ? `Pedido ${payingOne.id} pagado` : `${payment.orders.length} pedidos de la Mesa ${tableId} pagados`)
    // replace: con el botón atrás del navegador no se vuelve al cobro de algo ya pagado
    router.replace(payment.doneHref ?? payment.backHref, { scroll: false })
  }
  // Dividir Pago: va al cobro de los productos elegidos
  const handleSplitPay = () => {
    if (!split) return
    if (selected.size === 0) {
      toast.error('Selecciona algún producto')
      return
    }
    const lines = formatSelection(Array.from(selected, ([id, quantity]) => ({ id, quantity })))
    // La selección queda en la URL para recuperarla al volver atrás con el navegador
    window.history.replaceState(null, '', `${split.selectHref}&lineas=${lines}`)
    router.push(`${split.payHref}&lineas=${lines}#pedido`)
  }
  // Lo elegido de un producto fusionado es la suma de lo elegido de sus líneas
  const groupQuantity = (group: ItemGroup) => group.lines.reduce((sum, line) => sum + (selected.get(line.id) ?? 0), 0)
  // Se reparte por sus líneas en orden, empezando por las comandas más antiguas
  const setGroupQuantity = (group: ItemGroup, quantity: number) => setSelected(current => {
    const next = new Map(current)
    let left = quantity
    for (const line of group.lines) {
      const take = Math.min(left, line.quantity)
      if (take > 0) next.set(line.id, take)
      else next.delete(line.id)
      left -= take
    }
    return next
  })
  if (!visible) return null

  return (
    <aside id='pedido' className={payment || split ? 'scroll-mt-2' : 'md:h-screen md:overflow-y-scroll md:w-64 lg:w-96 p-5 scroll-mt-2 '}>
      {payment || split ? (
        <Link
          href={(payment ?? split)!.backHref}
          scroll={false}
          className='block mb-5 w-full py-2 rounded border-2 border-black font-bold uppercase text-center'
        >
          ← Volver atrás
        </Link>
      ) : visible && (
        <button
          type='button'
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className='md:hidden mb-5 w-full py-2 rounded border-2 border-black font-bold uppercase'
        >
          ↑ Volver arriba
        </button>
      )}
      <h1 className='text-4xl text-center'>
        {split || payment?.lines ? 'Dividir Pago'
          : payingOne ? `Pedido Nº ${payingOne.id}`
          : payment ? `Mesa ${tableId}`
          : 'Mi Pedido'}
      </h1>
      {payingOne?.name && <p className='text-lg text-center mt-2'>Cliente: {payingOne.name}</p>}
      {(split || payment?.lines) && (
        <p className='text-lg text-center mt-2'>
          Mesa {tableId}{split ? ': elige los productos que se pagan juntos' : ': productos seleccionados'}
        </p>
      )}
      {payment && !payment.lines && !payingOne && (
        <p className='text-lg text-center mt-2'>Pedidos Nº {payment.orders.map(item => item.id).join(', ')}</p>
      )}
      {order.length === 0 ? <p className="text-center my-10">El pedido esta vacío</p> : (
        <div className='mt-5'>
          {split ? splitGroups.map(group => (
            <ProductDetails
              key={group.item.id}
              item={group.item}
              selectable={{ quantity: groupQuantity(group), onChange: quantity => setGroupQuantity(group, quantity) }}
            />
          )) : order.map(item => (
            <ProductDetails
              key={item.id}
              item={item}
              readOnly={!!payment}
            />
          ))}

          {pending !== undefined && (
            <dl className='mt-20 text-xl space-y-1'>
              <div className='flex justify-between gap-2'>
                <dt>Pendiente</dt>
                <dd>{formatCurrency(pending)}</dd>
              </div>
              <div className='flex justify-between gap-2 font-bold'>
                <dt>{split ? 'Importe a pagar' : 'Total a pagar'}</dt>
                <dd>− {formatCurrency(total)}</dd>
              </div>
              <div className='flex justify-between gap-2 border-t border-gray-300 pt-1'>
                <dt>Quedará pendiente</dt>
                <dd>{formatCurrency(pendingAfter)}</dd>
              </div>
            </dl>
          )}
          <p className={`text-2xl text-center ${pending !== undefined ? 'mt-5' : 'mt-20'}`}>
            <span className='font-bold'>
              {split ? 'Importe a pagar' : 'Total a pagar'}: {formatCurrency(total)}
            </span>
          </p>
          <form
            className='w-full mt-10 space-y-5'
            action={split ? handleSplitPay : payment ? handlePayOrder : handleCreateOrder}
          >
            {!payment && !split && (
              <input
                type="text"
                placeholder={admin ? 'Nombre (opcional)' : 'Tu Nombre'}
                className='bg-white border border-gray-100 p-2 w-full'
                name='name'
                required={!admin} />
            )}

            {showAmountGiven && (
              <AmountGiven total={total} amount={amountGiven} onChange={setAmountGiven} />
            )}

            <input type="submit" className="py-2 rounded font-bold uppercase text-black bg-primary hover:bg-primary-dark w-full text-center cursor-pointer"
              value={split ? `Pagar ${formatCurrency(total)}` : payment ? 'Pagado' : 'Confirmar Pedido'}>
            </input>
          </form>
        </div>
      )}
    </aside>
  )
}
