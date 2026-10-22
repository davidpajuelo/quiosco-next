import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

// Eventos de Stripe ya procesados (idempotencia del webhook)
export const stripeEvents = pgTable("stripe_events", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    // La idempotencia del webhook depende de este UNIQUE (onConflictDoNothing)
    stripeEventId: text().notNull().unique(),
    eventType: text().notNull(),
    processedAt: timestamp({ withTimezone: true }).notNull().defaultNow()
})
