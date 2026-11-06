"use server"
import { revalidatePath } from "next/cache"
import { and, eq, inArray } from "drizzle-orm"
import { db } from "@/src/db"
import { orders } from "@/src/db/schema"
import { getStripe } from "@/src/lib/stripe"
import { AmountGivenSchema, OrderIdSchema, OrderIdsSchema, isAmountEnough } from "@/src/schema"
import type { PaymentStatus } from "@/src/types"

export async function completeOrder(formdata: FormData) {

    const data = {
        order_id: formdata.get('order_id')
    }
    const result = OrderIdSchema.safeParse(data)
    if (!result.success) {
        return { errors: result.error.issues }
    }
    try {
        const updated = await db.update(orders)
            .set({ status: true, orderReadyAt: new Date(Date.now()) })
            .where(eq(orders.id, result.data.order_id))
            .returning({ id: orders.id })
        // Drizzle no lanza si el pedido no existe
        if (updated.length === 0) {
            return { errors: [{ message: 'No se pudo completar la orden' }] }
        }
        revalidatePath('/admin/orders')
        return { success: true }
    } catch (error) {
        console.log(error)
        return { errors: [{ message: 'No se pudo completar la orden' }] }
    }
}

export async function uncompleteOrder(orderId: number) {

    const result = OrderIdSchema.safeParse({ order_id: String(orderId) })
    if (!result.success) {
        return { errors: result.error.issues }
    }
    try {
        const updated = await db.update(orders)
            .set({ status: false, orderReadyAt: null })
            .where(eq(orders.id, result.data.order_id))
            .returning({ id: orders.id })
        if (updated.length === 0) {
            return { errors: [{ message: 'No se pudo deshacer la orden' }] }
        }
        revalidatePath('/admin/orders')
        return { success: true }
    } catch (error) {
        console.log(error)
        return { errors: [{ message: 'No se pudo deshacer la orden' }] }
    }
}

// Algún pedido dejó de estar Pendiente de pago entre la lectura y el cobro
class OrderNotPendingError extends Error {}

// Cobro en el local de pedidos Pendientes de pago (los de las mesas de las salas se piden sin pagar):
// uno solo desde su comanda o todos los de la mesa. Se pagan todos o ninguno
export async function markOrdersPaid(orderIds: unknown, amountGiven: unknown) {

    const result = OrderIdsSchema.safeParse(orderIds)
    if (!result.success) {
        return { errors: result.error.issues }
    }
    const amount = AmountGivenSchema.safeParse(amountGiven)
    if (!amount.success) {
        return { errors: amount.error.issues }
    }
    const ids = Array.from(new Set(result.data))
    const notPending = ids.length === 1 ? 'El pedido no está pendiente de pago' : 'Algún pedido ya no está pendiente de pago'
    try {
        const found = await db.query.orders.findMany({
            columns: { id: true, total: true, paymentStatus: true, stripeCheckoutSessionId: true },
            where: inArray(orders.id, ids)
        })
        if (found.length !== ids.length || found.some(order => order.paymentStatus !== 'pending')) {
            return { errors: [{ message: notPending }] }
        }
        // El importe cobrado debe cubrir el total guardado en la BD (sumado en céntimos)
        const total = found.reduce((sum, order) => sum + Math.round(order.total * 100), 0) / 100
        if (!isAmountEnough(amount.data, total)) {
            return { errors: [{ message: 'El Importe entregado es menor que el Total a pagar' }] }
        }

        // Pedidos de clientes desde el QR: si pagan en el local se cierra su Checkout de Stripe
        // para que no puedan pagarlos dos veces. Se comprueban todos antes de cerrar ninguno
        const fromStripe = found.filter(order => order.stripeCheckoutSessionId)
        if (fromStripe.length > 0) {
            const stripe = getStripe()
            const sessions = await Promise.all(
                fromStripe.map(order => stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId!))
            )
            const paidIndex = sessions.findIndex(session => session.status === 'complete')
            if (paidIndex !== -1) {
                return { errors: [{ message: `El cliente ya ha pagado con Stripe el pedido ${fromStripe[paidIndex].id}` }] }
            }
            await Promise.all(sessions
                .filter(session => session.status === 'open')
                .map(session => stripe.checkout.sessions.expire(session.id)))
        }

        const paidAt = new Date()
        await db.transaction(async (tx) => {
            for (const order of found) {
                // El webhook del Checkout caducado puede llegar antes y dejarlo como cancelado
                const unpaid: PaymentStatus[] = order.stripeCheckoutSessionId
                    ? ['pending', 'payment_failed', 'cancelled']
                    : ['pending']
                const updated = await tx.update(orders)
                    .set({ paymentStatus: 'paid', paidAt })
                    .where(and(eq(orders.id, order.id), inArray(orders.paymentStatus, unpaid)))
                    .returning({ id: orders.id })
                // Deshace los ya marcados: o se pagan todos o ninguno
                if (updated.length === 0) throw new OrderNotPendingError()
            }
        })
        revalidatePath('/admin/orders')
        revalidatePath('/admin/salas', 'layout')
        return { success: true }
    } catch (error) {
        if (error instanceof OrderNotPendingError) {
            return { errors: [{ message: notPending }] }
        }
        console.log(error)
        return { errors: [{ message: ids.length === 1 ? 'No se pudo marcar el pedido como pagado' : 'No se pudieron marcar los pedidos como pagados' }] }
    }
}
