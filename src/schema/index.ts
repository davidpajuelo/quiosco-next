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

// Importe máximo de un producto (Stripe admite hasta 999.999,99 €)
export const PRODUCT_MAX_PRICE = 999999.99

export const ManualProductSchema = z.object({
    name: z.string()
        .trim()
        .min(1, 'El nombre del producto es obligatorio')
        .max(100, 'El nombre del producto es demasiado largo'),
    price: z.number()
        .positive('El importe debe ser mayor que 0')
        .max(PRODUCT_MAX_PRICE, 'El importe es demasiado alto')
})

// Producto de la carta desde el formulario del admin: los valores llegan como texto en el FormData
export const ProductSchema = z.object({
    name: z.string({ error: 'El nombre del producto es obligatorio' })
        .trim()
        .min(1, 'El nombre del producto es obligatorio')
        .max(100, 'El nombre del producto es demasiado largo'),
    price: z.string({ error: 'El precio es obligatorio' })
        .trim()
        .min(1, 'El precio es obligatorio')
        .pipe(z.coerce.number<string>({ error: 'El precio no es válido' })
            .positive('El precio debe ser mayor que 0')
            .max(PRODUCT_MAX_PRICE, 'El precio es demasiado alto')),
    categoryId: z.string({ error: 'La categoría es obligatoria' })
        .min(1, 'La categoría es obligatoria')
        .pipe(z.coerce.number<string>({ error: 'La categoría no es válida' })
            .int('La categoría no es válida')
            .positive('La categoría no es válida'))
})

export const PRODUCT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
// Por debajo del bodySizeLimit de las Server Actions en next.config.mjs
export const PRODUCT_IMAGE_MAX_SIZE = 4 * 1024 * 1024

// Un input file vacío llega como un File de 0 bytes
export function hasImage(value: unknown): value is File {
    return value instanceof File && value.size > 0
}

export const ProductImageSchema = z.custom<File>(hasImage, { error: 'La imagen del producto es obligatoria' })
    .refine(file => PRODUCT_IMAGE_TYPES.includes(file.type), 'La imagen debe ser JPG, PNG o WEBP')
    .refine(file => file.size <= PRODUCT_IMAGE_MAX_SIZE, 'La imagen no puede superar los 4 MB')

export const ProductIdSchema = z.coerce.number().int().positive()
export const OrderIdSchema = z.object({
    order_id: z.string()
                    .transform((value) => parseInt(value))
                    .refine(value => value > 0, { message: 'Hay errores' })
})