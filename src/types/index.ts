import type { categories, orderProducts, orders, paymentStatus, products } from "../db/schema"

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
