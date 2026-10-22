import { doublePrecision, index, integer, pgTable, text } from "drizzle-orm/pg-core"

export const categories = pgTable("categories", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    // La carta se busca por slug (/order/[category])
    slug: text().notNull().unique()
})

export const products = pgTable("products", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    price: doublePrecision().notNull(),
    image: text().notNull(),
    categoryId: integer().notNull().references(() => categories.id, { onDelete: "restrict" })
}, (t) => [
    index().on(t.categoryId)
])
