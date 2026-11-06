"use server"
import { revalidatePath } from "next/cache"
import { and, eq, inArray } from "drizzle-orm"
import { db } from "@/src/db"
import { orderProducts, orders } from "@/src/db/schema"
import { getStripe } from "@/src/lib/stripe"
import { AmountGivenSchema, LinePaymentSchema, OrderIdSchema, OrderIdsSchema, isAmountEnough } from "@/src/schema"
import type { PaymentStatus } from "@/src/types"
import { chargeCents, completesOrder, fromCents, linePrice, linesToPay, type LineSelection } from "@/src/utils/payments"

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

// Algún pedido o producto dejó de estar Pendiente de pago entre la lectura y el cobro
class NotPendingError extends Error {}

type PayResponse = { errors: { message: string }[] } | { success: true }

// Cobro en el local de pedidos Pendientes de pago enteros (los de las mesas de las salas se piden
// sin pagar): uno solo desde su comanda o todos los de la mesa (Pagar todo)
export async function markOrdersPaid(orderIds: unknown, amountGiven: unknown): Promise<PayResponse> {
    const ids = OrderIdsSchema.safeParse(orderIds)
    if (!ids.success) {
        return { errors: ids.error.issues }
    }
    return payOrders(Array.from(new Set(ids.data)), null, amountGiven)
}

// Dividir Pago: cobra solo los productos elegidos y la cantidad elegida de cada uno, que quedan
// como Producto Pagado. El pedido queda Pagado cuando se pagan todos sus productos
export async function markLinesPaid(lines: unknown, amountGiven: unknown): Promise<PayResponse> {
    const result = LinePaymentSchema.safeParse(lines)
    if (!result.success) {
        return { errors: result.error.issues }
    }
    const selection: LineSelection = new Map(result.data.map(line => [line.id, line.quantity]))
    try {
        const found = await db.select({ orderId: orderProducts.orderId })
            .from(orderProducts)
            .where(inArray(orderProducts.id, Array.from(selection.keys())))
        if (found.length !== selection.size) {
            return { errors: [{ message: 'Algún producto ya no existe' }] }
        }
        return payOrders(Array.from(new Set(found.map(line => line.orderId))), selection, amountGiven)
    } catch (error) {
        console.log(error)
        return { errors: [{ message: 'No se pudieron marcar los productos como pagados' }] }
    }
}

// Se paga todo o nada. selection null: todo lo que queda de los pedidos
async function payOrders(orderIds: number[], selection: LineSelection | null, amountGiven: unknown): Promise<PayResponse> {
    const amount = AmountGivenSchema.safeParse(amountGiven)
    if (!amount.success) {
        return { errors: amount.error.issues }
    }
    const notPending = selection
        ? 'Algún producto ya no está pendiente de pago'
        : orderIds.length === 1 ? 'El pedido no está pendiente de pago' : 'Algún pedido ya no está pendiente de pago'
    try {
        const found = await db.query.orders.findMany({
            columns: { id: true, total: true, paymentStatus: true, stripeCheckoutSessionId: true },
            where: inArray(orders.id, orderIds),
            with: {
                orderProducts: {
                    columns: { id: true, productId: true, name: true, quantity: true, price: true, paid: true },
                    with: { product: { columns: { price: true } } }
                }
            }
        })
        if (found.length !== orderIds.length || found.some(order => order.paymentStatus !== 'pending')) {
            return { errors: [{ message: notPending }] }
        }
        // Cada producto elegido tiene que seguir sin pagar y tener al menos la cantidad elegida
        if (selection) {
            const unpaid = new Map(found.flatMap(order => order.orderProducts.filter(line => !line.paid).map(line => [line.id, line.quantity])))
            const valid = Array.from(selection).every(([id, quantity]) => quantity <= (unpaid.get(id) ?? 0))
            if (!valid) {
                return { errors: [{ message: notPending }] }
            }
        }
        // El importe cobrado debe cubrir lo pendiente calculado con la BD
        const due = fromCents(found.reduce((sum, order) => sum + chargeCents(order, selection), 0))
        if (!isAmountEnough(amount.data, due)) {
            return { errors: [{ message: 'El Importe entregado es menor que el Total a pagar' }] }
        }

        // Pedidos de clientes desde el QR: si pagan (o pagan una parte) en el local se cierra su
        // Checkout de Stripe para que no puedan pagarlos dos veces. Se comprueban todos antes de cerrar ninguno
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
                const completes = completesOrder(order, selection)
                // El webhook del Checkout caducado puede llegar antes y dejarlo como cancelado
                const unpaid: PaymentStatus[] = order.stripeCheckoutSessionId
                    ? ['pending', 'payment_failed', 'cancelled']
                    : ['pending']
                // Primero el pedido, que queda bloqueado hasta el final de la transacción
                const updated = await tx.update(orders)
                    .set({
                        paymentStatus: completes ? 'paid' : 'pending',
                        ...(completes && { paidAt }),
                        // Pagado en parte: se desvincula de su Checkout ya caducado para que el webhook
                        // no lo cancele mientras queda algo por pagar
                        ...(!completes && order.stripeCheckoutSessionId && { stripeCheckoutSessionId: null })
                    })
                    .where(and(eq(orders.id, order.id), inArray(orders.paymentStatus, unpaid)))
                    .returning({ id: orders.id })
                if (updated.length === 0) throw new NotPendingError()

                for (const { line, quantity } of linesToPay(order.orderProducts, selection)) {
                    const price = linePrice(line)
                    const partial = quantity < line.quantity
                    // La línea tiene que seguir como se leyó: sin pagar y con la misma cantidad
                    const changed = await tx.update(orderProducts)
                        .set(partial
                            // Pago de una parte: la línea se queda con lo que falta por pagar...
                            ? { quantity: line.quantity - quantity, price }
                            : { paid: true })
                        .where(and(
                            eq(orderProducts.id, line.id),
                            eq(orderProducts.paid, false),
                            eq(orderProducts.quantity, line.quantity)
                        ))
                        .returning({ id: orderProducts.id })
                    // Deshace lo ya marcado: o se paga todo o nada
                    if (changed.length === 0) throw new NotPendingError()
                    // ...y lo pagado pasa a una línea nueva, igual pero como Producto Pagado
                    if (partial) {
                        await tx.insert(orderProducts).values({
                            orderId: order.id,
                            productId: line.productId,
                            name: line.name,
                            price,
                            quantity,
                            paid: true
                        })
                    }
                }
            }
        })
        revalidatePath('/admin/orders')
        revalidatePath('/admin/salas', 'layout')
        return { success: true }
    } catch (error) {
        if (error instanceof NotPendingError) {
            return { errors: [{ message: notPending }] }
        }
        console.log(error)
        return { errors: [{ message: 'No se pudo completar el pago' }] }
    }
}
