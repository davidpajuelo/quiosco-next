import { boolean, doublePrecision, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { products } from "./catalog"
import { paymentStatus } from "./enums"

// Mesas del local; el id es el que va en el QR (/mesa/<id>). La "0" es la del admin
export const tables = pgTable("tables", {
    id: text().primaryKey()
})

export const orders = pgTable("orders", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    total: doublePrecision().notNull(),
    date: timestamp({ withTimezone: true }).notNull().defaultNow(),
    status: boolean().notNull().default(false),
    orderReadyAt: timestamp({ withTimezone: true }),
    tableId: text().references(() => tables.id, { onDelete: "set null" }),
    paymentStatus: paymentStatus().notNull().default("pending"),
    stripeCheckoutSessionId: text().unique(),
    stripePaymentIntentId: text().unique(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp({ withTimezone: true })
}, (t) => [
    index().on(t.tableId)
])

export const orderProducts = pgTable("order_products", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    orderId: integer().notNull().references(() => orders.id, { onDelete: "restrict" }),
    // Sin producto en las líneas manuales del quiosco de admin y en las de productos borrados,
    // que guardan su nombre y precio
    productId: integer().references(() => products.id, { onDelete: "restrict" }),
    name: text(),
    price: doublePrecision(),
    quantity: integer().notNull()
}, (t) => [
    index().on(t.orderId),
    index().on(t.productId)
])
