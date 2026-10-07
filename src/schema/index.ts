import{ z } from 'zod'

export const OrderSchema = z.object({
    name: z.string()
                .min(1, 'Tu Nombre es Obligatorio'),
    total: z.number()
            .min(1,'Hay errores en el Pedido'),
    order:  z.array(z.object({
        id: z.number(),
        name: z.string(),
        price: z.number(),
        quantity: z.number().int().min(1, 'Hay errores en el Pedido'),
        subtotal: z.number()
    }))
})