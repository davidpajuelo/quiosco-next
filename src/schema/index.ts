import { z } from 'zod'

export const OrderSchema = z.object({
    name: z.string()
        .min(1, 'Tu Nombre es Obligatorio'),
    total: z.number()
        .min(1, 'Hay errores en el Pedido'),
    order: z.array(z.object({
        id: z.number(),
        name: z.string(),
        price: z.number(),
        quantity: z.number().int().min(1, 'Hay errores en el Pedido'),
        subtotal: z.number(),
        manual: z.boolean().optional()
    }))
})

// Pedido desde el quiosco de admin: el nombre es opcional y hay que indicar lo que entrega el cliente,
// que siempre es mayor o igual que el Total a pagar
export const AdminOrderSchema = OrderSchema.extend({
    name: z.string().trim(),
    amountGiven: z.number({
        error: (issue) => issue.input === undefined ? 'El Importe entregado es Obligatorio' : 'El Importe entregado no es válido'
    })
}).refine(data => isAmountEnough(data.amountGiven, data.total), {
    message: 'El Importe entregado es menor que el Total a pagar',
    path: ['amountGiven']
})

// Compara en céntimos para evitar errores de redondeo con decimales
export function isAmountEnough(amountGiven: number, total: number) {
    return Math.round(amountGiven * 100) >= Math.round(total * 100)
}

// Importe máximo de un producto manual (Stripe admite hasta 999.999,99 €)
export const MANUAL_PRODUCT_MAX_PRICE = 999999.99

export const ManualProductSchema = z.object({
    name: z.string()
        .trim()
        .min(1, 'El nombre del producto es obligatorio')
        .max(100, 'El nombre del producto es demasiado largo'),
    price: z.number()
        .positive('El importe debe ser mayor que 0')
        .max(MANUAL_PRODUCT_MAX_PRICE, 'El importe es demasiado alto')
})
export const OrderIdSchema = z.object({
    order_id: z.string()
                    .transform((value) => parseInt(value))
                    .refine(value => value > 0, { message: 'Hay errores' })
})