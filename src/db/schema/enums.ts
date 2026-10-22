import { pgEnum } from "drizzle-orm/pg-core"

// casing no afecta a los nombres de tipos: se escribe en snake_case a mano
export const paymentStatus = pgEnum("payment_status", ["pending", "paid", "cancelled", "refunded", "payment_failed"])
