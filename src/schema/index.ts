import { z } from 'zod'
import { ADMIN_TABLE_ID } from '@/src/lib/table-session'

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

// Pedido tomado por el admin en una mesa de una sala: el nombre es opcional y se cobra después,
// así que no lleva Importe entregado (queda Pendiente de pago)
export const TableOrderSchema = OrderSchema.extend({
    name: z.string().trim()
})

// Lo que entrega el cliente al pagar en el local
export const AmountGivenSchema = z.number({
    error: (issue) => issue.input === undefined ? 'El Importe entregado es Obligatorio' : 'El Importe entregado no es válido'
})

// Lo entregado siempre es mayor o igual que el Total a pagar
const coversTotal = (data: { total: number, amountGiven: number }) => isAmountEnough(data.amountGiven, data.total)
const coversTotalError = { message: 'El Importe entregado es menor que el Total a pagar', path: ['amountGiven'] }

// Pedido desde el quiosco de admin: se cobra al momento y hay que indicar lo que entrega el cliente
export const AdminOrderSchema = TableOrderSchema.extend({
    amountGiven: AmountGivenSchema
}).refine(coversTotal, coversTotalError)

// Cobro en el local de un pedido ya hecho y Pendiente de pago (mesas de las salas)
export const OrderPaymentSchema = z.object({
    total: z.number(),
    amountGiven: AmountGivenSchema
}).refine(coversTotal, coversTotalError)

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

// Pedidos que se cobran juntos: uno (su comanda) o todos los Pendientes de pago de una mesa
export const OrderIdsSchema = z.array(z.number().int().positive(), { error: 'Hay errores' })
    .min(1, 'No hay pedidos que cobrar')
    .max(200, 'Hay demasiados pedidos')

// Productos (líneas de pedido) que se cobran juntos con Dividir Pago y cuántos de cada uno
export const LinePaymentSchema = z.array(z.object({
    id: z.number().int().positive(),
    quantity: z.number().int().positive('La cantidad a pagar no es válida')
}), { error: 'Hay errores' })
    .min(1, 'Selecciona algún producto')
    .max(500, 'Hay demasiados productos')
    .refine(lines => new Set(lines.map(line => line.id)).size === lines.length, 'Hay productos repetidos')

export const RoomIdSchema = z.coerce.number().int().positive()

export const RoomNameSchema = z.string({ error: 'El nombre de la sala es obligatorio' })
    .trim()
    .min(1, 'El nombre de la sala es obligatorio')
    .max(60, 'El nombre de la sala es demasiado largo')

// Va en la URL del QR (/mesa/<código>)
export const TableCodeSchema = z.string()
    .trim()
    .min(1, 'Cada mesa y taburete necesita un código')
    .max(20, 'El código es demasiado largo')
    .regex(/^[A-Za-z0-9_-]+$/, 'El código solo puede tener letras, números, - y _')
    .refine(code => code !== ADMIN_TABLE_ID, `El código ${ADMIN_TABLE_ID} está reservado para el quiosco de admin`)

// Medidas del plano en centímetros
const coordinate = z.number().finite().min(-100000).max(100000)
const size = z.number().finite().min(10, 'Un elemento mide como mínimo 10 cm').max(10000, 'Un elemento mide como máximo 100 m')

export const RoomElementSchema = z.object({
    kind: z.enum(['table', 'stool', 'bar', 'obstacle']),
    shape: z.enum(['rect', 'circle']),
    x: coordinate,
    y: coordinate,
    width: size,
    height: size,
    rotation: z.number().finite().min(-360).max(360),
    label: z.string().trim().max(40, 'La etiqueta es demasiado larga').nullable(),
    code: z.string().nullable()
}).superRefine((element, ctx) => {
    const isTable = element.kind === 'table' || element.kind === 'stool'
    if (!isTable) {
        if (element.code !== null) ctx.addIssue({ code: 'custom', message: 'Solo las mesas y los taburetes llevan código' })
        return
    }
    const code = TableCodeSchema.safeParse(element.code ?? '')
    if (!code.success) code.error.issues.forEach(issue => ctx.addIssue({ code: 'custom', message: issue.message }))
})

export const RoomLayoutSchema = z.object({
    name: RoomNameSchema,
    outline: z.array(z.object({ x: coordinate, y: coordinate }))
        .min(3, 'El contorno de la sala necesita al menos 3 puntos')
        .max(100, 'El contorno de la sala tiene demasiados puntos'),
    elements: z.array(RoomElementSchema).max(500, 'La sala tiene demasiados elementos')
}).superRefine((layout, ctx) => {
    const seen = new Set<string>()
    for (const element of layout.elements) {
        const code = element.code?.trim()
        if (!code) continue
        if (seen.has(code)) ctx.addIssue({ code: 'custom', message: `El código ${code} está repetido` })
        seen.add(code)
    }
})

export type RoomLayout = z.input<typeof RoomLayoutSchema>
export type RoomLayoutElement = z.input<typeof RoomElementSchema>
