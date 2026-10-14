import OrderList from '@/components/order/OrderList'
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
    <OrderList orders={orders} />
  )
}
