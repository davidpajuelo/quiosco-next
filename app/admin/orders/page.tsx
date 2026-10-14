import OrderCard from '@/components/order/OrderCard'
import Heading from '@/components/ui/Heading'
import { prisma } from '@/src/lib/prisma'
import React from 'react'

async function getPendingOrders() {
  const orders = await prisma.order.findMany({
    where: {
      status: false
    },
    orderBy: {
      date: 'asc'
    },
    include: {
      orderProducts: {
        include: {
          product: true
        }
      }
    }
  })
  return orders
}

export default async function Orders() {
  const orders = await getPendingOrders()
  return (
    <>
      <Heading>Administrar Pedidos</Heading>
      {orders.length ? (
        <div className='grid grid-cols-1 lg:grid-cols-2 2xl:grid-col-3'>
          {orders.map( order => (
            <OrderCard
              key={order.id}
              order={order}
            />
          ))}
        </div>
      ) : <p className="text-center" ></p>}

    </>
  )
}
