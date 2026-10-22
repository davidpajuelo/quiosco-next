import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { and, eq, inArray, notInArray, type SQL } from "drizzle-orm"
import { db } from "@/src/db"
import { orders, stripeEvents } from "@/src/db/schema"
import { getStripe } from "@/src/lib/stripe"

// El where es SQL, nunca SQL | undefined: update().where(undefined) actualizaría todos los pedidos
type OrderUpdate = {
    where: SQL
    set: Partial<typeof orders.$inferInsert>
}

// and() devuelve SQL | undefined en sus tipos; con dos condiciones nunca es undefined
function bySession(sessionId: string, status: SQL): SQL {
    return and(eq(orders.stripeCheckoutSessionId, sessionId), status)!
}

// Traduce el evento de Stripe al cambio que hay que aplicar en el pedido
async function getOrderUpdate(event: Stripe.Event): Promise<OrderUpdate | null> {
    switch (event.type) {
        case 'checkout.session.completed':
        case 'checkout.session.async_payment_succeeded': {
            const session = event.data.object
            if (session.payment_status !== 'paid') return null
            return {
                where: bySession(session.id, notInArray(orders.paymentStatus, ['paid', 'refunded'])),
                set: {
                    paymentStatus: 'paid',
                    paidAt: new Date(),
                    // undefined se ignora en set, igual que en Prisma
                    stripePaymentIntentId: typeof session.payment_intent === 'string'
                        ? session.payment_intent
                        : session.payment_intent?.id
                }
            }
        }
        case 'checkout.session.async_payment_failed':
            return {
                where: bySession(event.data.object.id, eq(orders.paymentStatus, 'pending')),
                set: { paymentStatus: 'payment_failed' }
            }
        case 'checkout.session.expired':
            return {
                where: bySession(event.data.object.id, inArray(orders.paymentStatus, ['pending', 'payment_failed'])),
                set: { paymentStatus: 'cancelled' }
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
                where: bySession(session.id, eq(orders.paymentStatus, 'pending')),
                set: {
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
        await db.transaction(async (tx) => {
            // Idempotencia: si el evento ya está registrado no se vuelve a procesar.
            // Va en la misma transacción que el pedido para que, si falla, Stripe lo reintente.
            const inserted = await tx.insert(stripeEvents)
                .values({ stripeEventId: event.id, eventType: event.type })
                .onConflictDoNothing({ target: stripeEvents.stripeEventId })
                .returning({ id: stripeEvents.id })
            if (inserted.length === 0 || !orderUpdate) return
            await tx.update(orders).set(orderUpdate.set).where(orderUpdate.where)
        })
    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: 'Error al procesar el evento' }, { status: 500 })
    }

    return NextResponse.json({ received: true })
}
