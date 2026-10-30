import { pgEnum } from "drizzle-orm/pg-core"

// casing no afecta a los nombres de tipos: se escribe en snake_case a mano
export const paymentStatus = pgEnum("payment_status", ["pending", "paid", "cancelled", "refunded", "payment_failed"])

// Elementos del plano de una sala: mesas y taburetes se dan de alta como mesas, barra y obstáculos no
export const roomElementKind = pgEnum("room_element_kind", ["table", "stool", "bar", "obstacle"])
export const roomElementShape = pgEnum("room_element_shape", ["rect", "circle"])
