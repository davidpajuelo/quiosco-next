"use client"
import Link from 'next/link'
import { useStore } from '@/src/store'
import { useParams, useRouter } from 'next/navigation'
import { toast} from 'react-toastify'
import React, { useMemo, useState } from 'react'
import ProductDetails from './ProductDetails'
import { formatCurrency } from '@/src/utils'
import { createOrder } from '@/actions/create-order-actions'
import { markOrdersPaid } from '@/actions/complete-order.actions'
import { AdminOrderSchema, OrderPaymentSchema, OrderSchema, TableOrderSchema } from '@/src/schema'
import type { OrderItem, OrderWithProducts } from '@/src/types'
import AmountGiven from '@/components/admin/AmountGiven'
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
  // Cobro de pedidos ya hechos y Pendientes de pago (Salas): una comanda o todas las de la mesa.
  // Sus productos no se pueden cambiar, se pide el Importe entregado y se marcan como Pagados.
  // backHref vuelve a los pedidos de la mesa
  payment?: { orders: OrderWithProducts[], backHref: string }
}

// Líneas de los pedidos guardados con la forma de las del carrito. Si se cobran varios pedidos,
// el mismo producto al mismo precio se junta en una línea, como en una cuenta
function toOrderItems(orders: OrderWithProducts[]): OrderItem[] {
  const items = new Map<string, OrderItem>()
  for (const line of orders.flatMap(order => order.orderProducts)) {
    const name = line.product?.name ?? line.name ?? ''
    const price = line.product?.price ?? line.price ?? 0
    const key = `${line.productId ?? 'manual'}|${name}|${price}`
    const item = items.get(key)
    if (item) {
      item.quantity += line.quantity
      item.subtotal = price * item.quantity
    } else {
      items.set(key, { id: line.id, name, price, quantity: line.quantity, subtotal: price * line.quantity })
    }
  }
  return Array.from(items.values())
}

export default function OrderSummary({ submitOrder = createOrder, alwaysVisible = false, admin = false, amountGiven: withAmountGiven = admin, payment }: OrderSummaryProps) {
  const cart = useStore((state) => state.order)
  const clearOrder = useStore((state) => state.clearOrder)
  const router = useRouter()
  const [amountGiven, setAmountGiven] = useState('')
  // Solo hay categoría en la URL cuando el usuario ha pulsado una
  const { category } = useParams<{ category?: string }>()
  const visible = alwaysVisible || !!payment || !!category
  // Al cobrar se muestra el pedido guardado y su total, no el carrito
  const order = useMemo(() => payment ? toOrderItems(payment.orders) : cart, [payment, cart])
  const cartTotal = useMemo(() => cart.reduce((total, item) => total + (item.quantity * item.price), 0), [cart])
  // Total de lo que se cobra: el guardado en cada pedido, sumado en céntimos
  const total = payment ? payment.orders.reduce((sum, item) => sum + Math.round(item.total * 100), 0) / 100 : cartTotal
  const payingOne = payment?.orders.length === 1 ? payment.orders[0] : null
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
  // Marca como Pagado el pedido de la mesa y vuelve a sus Pedidos pendientes
  const handlePayOrder = async () => {
    if (!payment) return
    const result = OrderPaymentSchema.safeParse({ total, amountGiven: amountGivenValue })
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        toast.error(issue.message)
      })
      return
    }
    const response = await markOrdersPaid(payment.orders.map(item => item.id), result.data.amountGiven)
    if (response.errors) {
      response.errors.forEach((issue) => {
        toast.error(issue.message)
      })
      return
    }
    toast.success(payingOne ? `Pedido ${payingOne.id} pagado` : `${payment.orders.length} pedidos de la Mesa ${payment.orders[0].tableId} pagados`)
    // replace: con el botón atrás del navegador no se vuelve al cobro de un pedido ya pagado
    router.replace(payment.backHref, { scroll: false })
  }
  if (!visible) return null

  return (
    <aside id='pedido' className={payment ? 'scroll-mt-2' : 'md:h-screen md:overflow-y-scroll md:w-64 lg:w-96 p-5 scroll-mt-2 '}>
      {payment ? (
        <Link
          href={payment.backHref}
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
        {!payment ? 'Mi Pedido' : payingOne ? `Pedido Nº ${payingOne.id}` : `Mesa ${payment.orders[0].tableId}`}
      </h1>
      {payingOne?.name && <p className='text-lg text-center mt-2'>Cliente: {payingOne.name}</p>}
      {payment && !payingOne && (
        <p className='text-lg text-center mt-2'>Pedidos Nº {payment.orders.map(item => item.id).join(', ')}</p>
      )}
      {order.length === 0 ? <p className="text-center my-10">El pedido esta vacío</p> : (
        <div className='mt-5'>
          {order.map(item => (
            <ProductDetails
              key={item.id}
              item={item}
              readOnly={!!payment}
            />
          ))}

          <p className='text-2xl mt-20 text-center'>
            <span className='font-bold'>
              Total a pagar: {formatCurrency(total)}
            </span>
          </p>
          <form
            className='w-full mt-10 space-y-5'
            action={payment ? handlePayOrder : handleCreateOrder}
          >
            {!payment && (
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
              value={payment ? 'Pagado' : 'Confirmar Pedido'}>
            </input>
          </form>
        </div>
      )}
    </aside>
  )
}
