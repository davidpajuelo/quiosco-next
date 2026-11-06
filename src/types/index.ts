import type { categories, orderProducts, orders, paymentStatus, products, roomElementKind, roomElementShape, roomElements, rooms } from "../db/schema"
export type { RoomPoint } from "../db/schema"

export type Category = typeof categories.$inferSelect
export type Product = typeof products.$inferSelect
export type Order = typeof orders.$inferSelect
export type OrderProduct = typeof orderProducts.$inferSelect
export type PaymentStatus = (typeof paymentStatus.enumValues)[number]

// Línea de pedido antes de tener orderId (sustituye a Prisma.OrderProductUncheckedCreateWithoutOrderInput)
export type NewOrderLine = Omit<typeof orderProducts.$inferInsert, 'orderId'>

export type OrderItem = Pick<Product, 'id' | 'name' | 'price'> & {
    quantity: number
    subtotal: number
    // Producto introducido a mano desde el quiosco de admin, no existe en la BD
    manual?: boolean
}

export type OrderWithProducts = Order & {
    orderProducts: (OrderProduct & {
        product: Product | null
    })[]
}

export type ProductWithCategory = Product & {
    category: Category
}

export type Room = typeof rooms.$inferSelect
export type RoomElement = typeof roomElements.$inferSelect
export type RoomElementKind = (typeof roomElementKind.enumValues)[number]
export type RoomElementShape = (typeof roomElementShape.enumValues)[number]

// Resumen de los pedidos de una mesa en la vista de Salas
export type TableOrderStats = {
    // Pedidos sin completar (los mismos que salen en Ordenes)
    open: number
    // Pedidos completados que siguen Pendientes de pago
    unpaidCompleted: number
    // Importe de todos sus pedidos Pendientes de pago, completados o no
    unpaidTotal: number
}
