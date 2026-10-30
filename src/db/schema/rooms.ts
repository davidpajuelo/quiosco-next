import { doublePrecision, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { roomElementKind, roomElementShape } from "./enums"
import { tables } from "./orders"

// Punto del plano, en centímetros
export type RoomPoint = { x: number, y: number }

// Salas del local (Sala principal, Terraza…) con su plano
export const rooms = pgTable("rooms", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    // Contorno de la sala: un polígono cualquiera, no tiene por qué ser rectangular
    outline: jsonb().$type<RoomPoint[]>().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
})

// Elementos del plano. x/y es el centro y las medidas van en centímetros
export const roomElements = pgTable("room_elements", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    roomId: integer().notNull().references(() => rooms.id, { onDelete: "cascade" }),
    kind: roomElementKind().notNull(),
    shape: roomElementShape().notNull().default("rect"),
    x: doublePrecision().notNull(),
    y: doublePrecision().notNull(),
    width: doublePrecision().notNull(),
    height: doublePrecision().notNull(),
    rotation: doublePrecision().notNull().default(0),
    label: text(),
    // Mesas y taburetes son mesas del local: su código es el id de la mesa (el del QR).
    // UNIQUE para que una mesa no esté en dos sitios del plano
    tableId: text().unique().references(() => tables.id, { onDelete: "set null" })
}, (t) => [
    index().on(t.roomId)
])
