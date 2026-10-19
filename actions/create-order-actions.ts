"use server"

import { cookies, headers } from "next/headers"
import { ADMIN_TABLE_ID, TABLE_COOKIE, readTableCookie } from "@/src/lib/table-session"
import { prisma } from "@/src/lib/prisma"
import { CheckoutItem, createCheckoutSession, getStripe } from "@/src/lib/stripe"
import { AdminOrderSchema, ManualProductSchema, OrderSchema, isAmountEnough } from "@/src/schema"
import { Prisma } from "@/src/generated/prisma/client"
import { z } from "zod"

type OrderErrors = { errors: { message: string }[] }

type ValidOrder = {
    name: string
    total: number
    items: CheckoutItem[]
    orderProducts: Prisma.OrderProductUncheckedCreateWithoutOrderInput[]
}

// El cliente va a la pasarela de pago (url); el admin solo recibe el pedido creado (orderId)
export type CreateOrderResponse = OrderErrors | { url: string } | { orderId: number }

// Pedidos de cliente desde la mesa: se pagan en el Checkout de Stripe
export async function createOrder(data: unknown): Promise<CreateOrderResponse> {
    // La mesa sale de la cookie, y se comprueba que exista
    const tableId = readTableCookie(cookies().get(TABLE_COOKIE)?.value)
    const table = tableId ? await prisma.table.findUnique({ where: { id: tableId } }) : null
    if (!table) {
        return {
            errors: [{ message: 'Mesa no identificada, escanea el QR de tu mesa' }]
        }
    }

    const result = OrderSchema.safeParse(data)
    if (!result.success){
        return {
            errors: result.error.issues
        }
    }
    const order = await validateOrder(result.data, false)
    if ('errors' in order) return order

    const origin = headers().get('origin')
    if (!origin) {
        return {
            errors: [{ message: 'No se pudo iniciar el pago' }]
        }
    }

    let session
    try{
        session = await createCheckoutSession(order.items, origin)
    }catch (error){
        console.log(error)
        return {
            errors: [{ message: 'No se pudo iniciar el pago' }]
        }
    }
    if (!session.url) {
        return {
            errors: [{ message: 'No se pudo iniciar el pago' }]
        }
    }

    try{
        await prisma.order.create({
            data: {
                name: order.name,
                total: order.total,
                tableId: table.id,
                stripeCheckoutSessionId: session.id,
                orderProducts: {
                    create: order.orderProducts
                }
            }
        })
    }catch (error){
        console.log(error)
        // Sin pedido guardado no se debe poder pagar esa sesión
        await getStripe().checkout.sessions.expire(session.id).catch(console.log)
        return {
            errors: [{ message: 'No se pudo crear el pedido' }]
        }
    }

    return {
        url: session.url
    }
}

// Pedidos hechos desde la vista del quiosco en el panel de administración (Mesa 0).
// No pasan por la pasarela: se cobran en el local y se guardan como pagados.
export async function createAdminOrder(data: unknown): Promise<CreateOrderResponse> {
    const result = AdminOrderSchema.safeParse(data)
    if (!result.success){
        return {
            errors: result.error.issues
        }
    }
    const order = await validateOrder(result.data, true)
    if ('errors' in order) return order

    // El importe cobrado debe cubrir el total calculado con los precios de la BD
    if (!isAmountEnough(result.data.amountGiven, order.total)) {
        return {
            errors: [{ message: 'El Importe entregado es menor que el Total a pagar' }]
        }
    }

    try{
        await prisma.table.upsert({
            where: { id: ADMIN_TABLE_ID },
            update: {},
            create: { id: ADMIN_TABLE_ID }
        })
        const { id } = await prisma.order.create({
            data: {
                name: order.name,
                total: order.total,
                tableId: ADMIN_TABLE_ID,
                paymentStatus: 'paid',
                paidAt: new Date(),
                orderProducts: {
                    create: order.orderProducts
                }
            }
        })
        return {
            orderId: id
        }
    }catch (error){
        console.log(error)
        return {
            errors: [{ message: 'No se pudo crear el pedido' }]
        }
    }
}

// Valida el pedido y calcula sus líneas con los precios buenos.
// Solo el quiosco de admin puede enviar productos manuales, con nombre y precio del cliente.
async function validateOrder(data: z.infer<typeof OrderSchema>, allowManual: boolean): Promise<OrderErrors | ValidOrder> {
    // Los precios se leen de la BD, nunca del cliente (salvo los productos manuales del admin)
    const products = await prisma.product.findMany({
        where: {
            id: { in: data.order.filter(item => !item.manual).map(item => item.id) }
        }
    })
    const items: CheckoutItem[] = []
    const orderProducts: Prisma.OrderProductUncheckedCreateWithoutOrderInput[] = []
    for (const item of data.order) {
        if (item.manual) {
            const manual = ManualProductSchema.safeParse(item)
            if (!allowManual || !manual.success) {
                return {
                    errors: [{ message: 'Hay errores en el Pedido' }]
                }
            }
            const line = {
                name: manual.data.name,
                price: Math.round(manual.data.price * 100) / 100,
                quantity: item.quantity
            }
            items.push(line)
            orderProducts.push(line)
            continue
        }
        const product = products.find(product => product.id === item.id)
        if (!product) {
            return {
                errors: [{ message: 'Hay errores en el Pedido' }]
            }
        }
        items.push({
            name: product.name,
            price: product.price,
            quantity: item.quantity
        })
        orderProducts.push({
            productId: product.id,
            quantity: item.quantity
        })
    }

    return {
        name: data.name,
        total: items.reduce((total, item) => total + (item.price * item.quantity), 0),
        items,
        orderProducts
    }
}
