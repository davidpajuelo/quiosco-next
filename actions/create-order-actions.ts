"use server"

import { headers } from "next/headers"
import { prisma } from "@/src/lib/prisma"
import { createCheckoutSession, getStripe } from "@/src/lib/stripe"
import { OrderSchema } from "@/src/schema"

type CreateOrderResponse = { errors: { message: string }[] } | { url: string }

export async function createOrder(data: unknown): Promise<CreateOrderResponse> {
    const result = OrderSchema.safeParse(data)
    if (!result.success){
        return {
            errors: result.error.issues
        }
    }

    const origin = headers().get('origin')
    if (!origin) {
        return {
            errors: [{ message: 'No se pudo iniciar el pago' }]
        }
    }

    // Los precios se leen de la BD, nunca del cliente
    const products = await prisma.product.findMany({
        where: {
            id: { in: result.data.order.map(item => item.id) }
        }
    })
    const items = []
    for (const item of result.data.order) {
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
    }
    const total = items.reduce((total, item) => total + (item.price * item.quantity), 0)

    let session
    try{
        session = await createCheckoutSession(items, origin)
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
                name: result.data.name,
                total,
                stripeCheckoutSessionId: session.id,
                orderProducts: {
                    create: result.data.order.map( product => ({
                        productId: product.id,
                        quantity: product.quantity
                    }))
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
