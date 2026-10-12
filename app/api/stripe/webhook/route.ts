import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { prisma } from "@/src/lib/prisma"
import { getStripe } from "@/src/lib/stripe"
import { Prisma } from "@/src/generated/prisma/client"

// Traduce el evento de Stripe al cambio que hay que aplicar en el pedido
async function getOrderUpdate(event: Stripe.Event): Promise<Prisma.OrderUpdateManyArgs | null> {
    switch (event.type) {
        case 'checkout.session.completed':
        case 'checkout.session.async_payment_succeeded': {
            const session = event.data.object
            if (session.payment_status !== 'paid') return null
            return {
                where: {
                    stripeCheckoutSessionId: session.id,
                    paymentStatus: { notIn: ['paid', 'refunded'] }
                },
                data: {
                    paymentStatus: 'paid',
                    paidAt: new Date(),
                    stripePaymentIntentId: typeof session.payment_intent === 'string'
                        ? session.payment_intent
                        : session.payment_intent?.id
                }
            }
        }
        case 'checkout.session.async_payment_failed':
            return {
                where: {
                    stripeCheckoutSessionId: event.data.object.id,
                    paymentStatus: 'pending'
                },
                data: { paymentStatus: 'payment_failed' }
            }
        case 'checkout.session.expired':
            return {
                where: {
                    stripeCheckoutSessionId: event.data.object.id,
                    paymentStatus: { in: ['pending', 'payment_failed'] }
                },
                data: { paymentStatus: 'cancelled' }
            }
        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object
            const sessions = await getStripe().checkout.sessions.list({
                payment_intent: paymentIntent.id,
                limit: 1
            })
            const session = sessions.data[0]
            if (!session) return null
            return {
                where: {
                    stripeCheckoutSessionId: session.id,
                    paymentStatus: 'pending'
                },
                data: {
                    paymentStatus: 'payment_failed',
                    stripePaymentIntentId: paymentIntent.id
                }
            }
        }
        default:
            return null
    }
}

export async function POST(request: Request) {
    const signature = request.headers.get('stripe-signature')
    const secret = process.env.STRIPE_WEB_HOOK_SECRET
    if (!signature || !secret) {
        return NextResponse.json({ error: 'Firma no válida' }, { status: 400 })
    }

    let event: Stripe.Event
    try {
        // La firma se verifica sobre el body sin parsear
        event = getStripe().webhooks.constructEvent(await request.text(), signature, secret)
    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: 'Firma no válida' }, { status: 400 })
    }

    try {
        const orderUpdate = await getOrderUpdate(event)
        await prisma.$transaction(async (tx) => {
            // Idempotencia: si el evento ya está registrado no se vuelve a procesar.
            // Va en la misma transacción que el pedido para que, si falla, Stripe lo reintente.
            const { count } = await tx.stripeEvent.createMany({
                data: [{ stripeEventId: event.id, eventType: event.type }],
                skipDuplicates: true
            })
            if (count === 0 || !orderUpdate) return
            await tx.order.updateMany(orderUpdate)
        })
    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: 'Error al procesar el evento' }, { status: 500 })
    }

    return NextResponse.json({ received: true })
}
