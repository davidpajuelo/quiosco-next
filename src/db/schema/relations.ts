import { relations } from "drizzle-orm"
import { categories, products } from "./catalog"
import { orderProducts, orders, tables } from "./orders"

// Mismos nombres de relación que en Prisma: OrderWithProducts y ProductWithCategory dependen de ellos

export const categoriesRelations = relations(categories, ({ many }) => ({
    products: many(products)
}))

export const productsRelations = relations(products, ({ one, many }) => ({
    category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
    orderItems: many(orderProducts)
}))

export const tablesRelations = relations(tables, ({ many }) => ({
    orders: many(orders)
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
    table: one(tables, { fields: [orders.tableId], references: [tables.id] }),
    orderProducts: many(orderProducts)
}))

export const orderProductsRelations = relations(orderProducts, ({ one }) => ({
    order: one(orders, { fields: [orderProducts.orderId], references: [orders.id] }),
    // productId es nullable, así que Drizzle infiere `product: Product | null`
    product: one(products, { fields: [orderProducts.productId], references: [products.id] })
}))
