"use server"
import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db } from "@/src/db"
import { orders } from "@/src/db/schema"
import { OrderIdSchema } from "@/src/schema"

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
