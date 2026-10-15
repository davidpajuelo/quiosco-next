import { NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"
import { PAYCOMET_AUTHORIZATION, PAYCOMET_REFUND, toCents, verifyNotificationHash } from "@/src/lib/paycomet"
import { Prisma } from "@/src/generated/prisma/client"

// Traduce la notificación de PAYCOMET al cambio que hay que aplicar en el pedido.
// Los filtros por paymentStatus hacen la actualización idempotente si PAYCOMET repite la notificación.
async function getOrderUpdate(params: URLSearchParams): Promise<Prisma.OrderUpdateManyArgs | null> {
    const paycometOrder = params.get('Order')
    if (!paycometOrder) return null

    const order = await prisma.order.findUnique({ where: { paycometOrder } })
    if (!order) {
        console.log(`PAYCOMET: pedido ${paycometOrder} no encontrado`)
        return null
    }
    // El importe notificado debe ser el del pedido completo
    if (params.get('Amount') !== String(toCents(order.total))) {
        console.log(`PAYCOMET: importe ${params.get('Amount')} no coincide con el pedido ${paycometOrder}`)
        return null
    }

    const isOk = params.get('Response') === 'OK'
    switch (params.get('TransactionType')) {
        case PAYCOMET_AUTHORIZATION:
            if (isOk) {
                return {
                    where: {
                        paycometOrder,
                        paymentStatus: { notIn: ['paid', 'refunded'] }
                    },
                    data: {
                        paymentStatus: 'paid',
                        paidAt: new Date(),
                        paycometId: params.get('paycometId')
                    }
                }
            }
            return {
                where: {
                    paycometOrder,
                    paymentStatus: 'pending'
                },
                data: { paymentStatus: 'payment_failed' }
            }
        case PAYCOMET_REFUND:
            if (!isOk) return null
            return {
                where: {
                    paycometOrder,
                    paymentStatus: 'paid'
                },
                data: { paymentStatus: 'refunded' }
            }
        default:
            return null
    }
}

// URL de notificación configurada en el panel de PAYCOMET (Terminales > Notificaciones).
// PAYCOMET llama aquí por POST, en segundo plano, cada vez que termina una operación.
export async function POST(request: Request) {
    const params = new URLSearchParams()
    try {
        const formData = await request.formData()
        formData.forEach((value, key) => {
            if (typeof value === 'string') params.append(key, value)
        })
    } catch (error) {
        console.log(error)
        return new NextResponse('PAYCOMET KO', { status: 400 })
    }

    let validHash = false
    try {
        validHash = verifyNotificationHash(params)
    } catch (error) {
        console.log(error)
    }
    if (!validHash) {
        return new NextResponse('PAYCOMET KO Firma', { status: 400 })
    }

    try {
        const orderUpdate = await getOrderUpdate(params)
        if (orderUpdate) {
            await prisma.order.updateMany(orderUpdate)
        }
    } catch (error) {
        console.log(error)
        return new NextResponse('PAYCOMET KO', { status: 500 })
    }

    return new NextResponse('PAYCOMET OK')
}
