import { Category, Order, OrderProduct, Product } from "../generated/prisma/client";
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
