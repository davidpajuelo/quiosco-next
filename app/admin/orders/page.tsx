import OrderList from '@/components/order/OrderList'
import { db } from '@/src/db'
import { orders } from '@/src/db/schema'
import { asc, eq } from 'drizzle-orm'
import React from 'react'

async function getPendingOrders() {
  return db.query.orders.findMany({
    where: eq(orders.status, false),
    orderBy: [asc(orders.date)],
    with: {
      orderProducts: {
        with: {
          product: true
        }
      }
    }
  })
}

export default async function Orders() {
  const orders = await getPendingOrders()
  return (
    <OrderList orders={orders} />
  )
}
