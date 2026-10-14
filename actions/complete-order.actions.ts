"use server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/src/lib/prisma"
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
        await prisma.order.update({
            where: {
                id: result.data.order_id
            },
            data: {
                status: true,
                orderReadyAt: new Date(Date.now())
            }
        })
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
        await prisma.order.update({
            where: {
                id: result.data.order_id
            },
            data: {
                status: false,
                orderReadyAt: null
            }
        })
        revalidatePath('/admin/orders')
        return { success: true }
    } catch (error) {
        console.log(error)
        return { errors: [{ message: 'No se pudo deshacer la orden' }] }
    }
}
