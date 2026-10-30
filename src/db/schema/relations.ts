import { relations } from "drizzle-orm"
import { categories, products } from "./catalog"
import { orderProducts, orders, tables } from "./orders"
import { roomElements, rooms } from "./rooms"

// Mismos nombres de relación que en Prisma: OrderWithProducts y ProductWithCategory dependen de ellos

export const categoriesRelations = relations(categories, ({ many }) => ({
    products: many(products)
}))

export const productsRelations = relations(products, ({ one, many }) => ({
    category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
    orderItems: many(orderProducts)
}))

export const tablesRelations = relations(tables, ({ many }) => ({
    orders: many(orders),
    // A lo sumo uno (table_id es UNIQUE), pero Drizzle solo infiere one() desde el lado con la FK
    roomElements: many(roomElements)
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

export const roomsRelations = relations(rooms, ({ many }) => ({
    elements: many(roomElements)
}))

export const roomElementsRelations = relations(roomElements, ({ one }) => ({
    room: one(rooms, { fields: [roomElements.roomId], references: [rooms.id] }),
    table: one(tables, { fields: [roomElements.tableId], references: [tables.id] })
}))
