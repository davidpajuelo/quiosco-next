"use server"

import { cookies, headers } from "next/headers"
import { TABLE_COOKIE, readTableCookie } from "@/src/lib/table-session"
import { prisma } from "@/src/lib/prisma"
import { createPaycometOrderReference, createPaymentForm } from "@/src/lib/paycomet"
import { OrderSchema } from "@/src/schema"

type CreateOrderResponse = { errors: { message: string }[] } | { url: string }

export async function createOrder(data: unknown): Promise<CreateOrderResponse> {
    const result = OrderSchema.safeParse(data)
    if (!result.success){
        return {
            errors: result.error.issues
        }
    }

    // La mesa sale de la cookie firmada, nunca del cliente
    const tableId = await readTableCookie(cookies().get(TABLE_COOKIE)?.value)
    if (!tableId) {
        return {
            errors: [{ message: 'Mesa no identificada, escanea el QR de tu mesa' }]
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

    const paycometOrder = createPaycometOrderReference()
    let paymentForm
    try{
        paymentForm = await createPaymentForm(items, paycometOrder, origin)
    }catch (error){
        console.log(error)
        return {
            errors: [{ message: 'No se pudo iniciar el pago' }]
        }
    }

    // Si el pedido no se guarda, la URL de pago nunca llega al cliente
    try{
        await prisma.order.create({
            data: {
                name: result.data.name,
                total,
                tableId,
                paycometOrder,
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
        return {
            errors: [{ message: 'No se pudo crear el pedido' }]
        }
    }

    return {
        url: paymentForm.url
    }
}
