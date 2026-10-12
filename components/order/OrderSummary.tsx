"use client"
import { useStore } from '@/src/store'
import { useParams } from 'next/navigation'
import { toast} from 'react-toastify'
import React, { useMemo } from 'react'
import ProductDetails from './ProductDetails'
import { formatCurrency } from '@/src/utils'
import { createOrder } from '@/actions/create-order-actions'
import { OrderSchema } from '@/src/schema'

export default function OrderSummary() {
  const order = useStore((state) => state.order)
  // Solo hay categoría en la URL cuando el usuario ha pulsado una
  const { category } = useParams<{ category?: string }>()
  const total = useMemo(() => order.reduce((total, item) => total + (item.quantity * item.price), 0), [order])
  const handleCreateOrder = async (formData: FormData) => {
    const data = {
      name: formData.get('name'),
      total,
      order
    }
    const result = OrderSchema.safeParse(data)
    
    if (! result.success) {
      result.error.issues.forEach((issue) => {
        toast.error(issue.message)
      })

      return
    }
   
    const response = await createOrder(data)
    if ('errors' in response) {
        response.errors.forEach((issue) => {
          toast.error(issue.message)
        })
        return
    }
    // Redirige al Checkout alojado de Stripe
    window.location.assign(response.url)
  }
  if (!category) return null

  return (
    <aside id='pedido' className='md:h-screen md:overflow-y-scroll md:w-64 lg:w-96 p-5 scroll-mt-2 '>
      {category && (
        <button
          type='button'
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className='md:hidden mb-5 w-full py-2 rounded border-2 border-black font-bold uppercase'
        >
          ↑ Volver arriba
        </button>
      )}
      <h1 className='text-4xl text-center font-black'>Mi Pedido</h1>
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
              placeholder='Tu Nombre'
              className='bg-white border border-gray-100 p-2 w-full'
              name='name'
              required />

            <input type="submit" className="py-2 rounded font-bold uppercase text-white bg-black w-full text-center cursor-pointer"
              value="Confirmar Pedido">
            </input>
          </form>
        </div>
      )}
    </aside>
  )
}
