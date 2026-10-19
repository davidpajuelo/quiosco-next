"use client"
import { useStore } from '@/src/store'
import { useParams } from 'next/navigation'
import { toast} from 'react-toastify'
import React, { useMemo, useState } from 'react'
import ProductDetails from './ProductDetails'
import { formatCurrency } from '@/src/utils'
import { createOrder } from '@/actions/create-order-actions'
import { AdminOrderSchema, OrderSchema } from '@/src/schema'
import AmountGiven from '@/components/admin/AmountGiven'
import { toPrice } from '@/components/admin/KeyManual'

type OrderSummaryProps = {
  // Acción que crea el pedido; el panel de administración usa la de la Mesa 0
  submitOrder?: typeof createOrder
  // Mostrar el pedido aunque no haya categoría en la URL (p. ej. producto manual del admin)
  alwaysVisible?: boolean
  // Pedido desde el admin: nombre opcional, Importe entregado obligatorio y vueltas
  admin?: boolean
}

export default function OrderSummary({ submitOrder = createOrder, alwaysVisible = false, admin = false }: OrderSummaryProps) {
  const order = useStore((state) => state.order)
  const clearOrder = useStore((state) => state.clearOrder)
  const [amountGiven, setAmountGiven] = useState('')
  // Solo hay categoría en la URL cuando el usuario ha pulsado una
  const { category } = useParams<{ category?: string }>()
  const visible = alwaysVisible || !!category
  const total = useMemo(() => order.reduce((total, item) => total + (item.quantity * item.price), 0), [order])
  const amountGivenValue = amountGiven === '' ? undefined : toPrice(amountGiven)
  const handleCreateOrder = async (formData: FormData) => {
    const data = {
      name: formData.get('name'),
      total,
      order,
      ...(admin && { amountGiven: amountGivenValue })
    }
    const result = (admin ? AdminOrderSchema : OrderSchema).safeParse(data)
    
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
    // Pedido del admin: ya está creado y cobrado en el local, sin pasarela
    toast.success(`Pedido ${response.orderId} creado`)
    clearOrder()
    setAmountGiven('')
  }
  if (!visible) return null

  return (
    <aside id='pedido' className='md:h-screen md:overflow-y-scroll md:w-64 lg:w-96 p-5 scroll-mt-2 '>
      {visible && (
        <button
          type='button'
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className='md:hidden mb-5 w-full py-2 rounded border-2 border-black font-bold uppercase'
        >
          ↑ Volver arriba
        </button>
      )}
      <h1 className='text-4xl text-center'>Mi Pedido</h1>
      {order.length === 0 ? <p className="text-center my-10">El pedido esta vacío</p> : (
        <div className='mt-5'>
          {order.map(item => (
            <ProductDetails
              key={item.id}
              item={item}
            />
          ))}

          <p className='text-2xl mt-20 text-center'>
            <span className='font-bold'>
              Total a pagar: {formatCurrency(total)}
            </span>
          </p>
          <form
            className='w-full mt-10 space-y-5'
            action={handleCreateOrder}
          >
            <input
              type="text"
              placeholder={admin ? 'Nombre (opcional)' : 'Tu Nombre'}
              className='bg-white border border-gray-100 p-2 w-full'
              name='name'
              required={!admin} />

            {admin && (
              <AmountGiven total={total} amount={amountGiven} onChange={setAmountGiven} />
            )}

            <input type="submit" className="py-2 rounded font-bold uppercase text-black bg-primary hover:bg-primary-dark w-full text-center cursor-pointer"
              value="Confirmar Pedido">
            </input>
          </form>
        </div>
      )}
    </aside>
  )
}
