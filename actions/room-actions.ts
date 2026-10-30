"use server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { and, eq, inArray, isNotNull, ne, notExists } from "drizzle-orm"
import { db } from "@/src/db"
import { orders, roomElements, rooms, tables } from "@/src/db/schema"
import { RoomIdSchema, RoomLayoutSchema, RoomNameSchema, type RoomLayout } from "@/src/schema"
import type { RoomPoint } from "@/src/types"

export type RoomActionResponse = { errors: { message: string }[] }

// Sala nueva: un rectángulo de 10 x 8 m
const DEFAULT_OUTLINE: RoomPoint[] = [
    { x: 0, y: 0 },
    { x: 1000, y: 0 },
    { x: 1000, y: 800 },
    { x: 0, y: 800 }
]

function findRoom(id: number) {
    return db.query.rooms.findFirst({ where: eq(rooms.id, id), columns: { id: true } })
}

// Al dar de baja mesas, las que tienen pedidos se conservan (se quedan sin ubicar)
// para no dejar esos pedidos sin mesa
function hasNoOrders() {
    return notExists(db.select({ id: orders.id }).from(orders).where(eq(orders.tableId, tables.id)))
}

function revalidateRooms() {
    revalidatePath('/admin/rooms')
    revalidatePath('/admin/rooms/[id]', 'page')
}

export async function createRoom(formData: FormData): Promise<RoomActionResponse> {
    const name = RoomNameSchema.safeParse(formData.get('name'))
    if (!name.success) {
        return { errors: name.error.issues }
    }

    let roomId: number
    try {
        const [room] = await db.insert(rooms)
            .values({ name: name.data, outline: DEFAULT_OUTLINE })
            .returning({ id: rooms.id })
        roomId = room.id
    } catch (error) {
        console.log(error)
        return { errors: [{ message: 'No se pudo crear la sala' }] }
    }

    revalidateRooms()
    redirect(`/admin/rooms/${roomId}`)
}

export type SaveRoomResponse = RoomActionResponse | { success: true }

// Guarda el plano entero. Las mesas y taburetes se dan de alta como mesas con su código
// y las que se han quitado del plano se dan de baja
export async function saveRoomLayout(id: number, layout: RoomLayout): Promise<SaveRoomResponse> {
    const roomId = RoomIdSchema.safeParse(id)
    const room = roomId.success ? await findRoom(roomId.data) : null
    if (!room) {
        return { errors: [{ message: 'La sala no existe' }] }
    }

    const result = RoomLayoutSchema.safeParse(layout)
    if (!result.success) {
        return { errors: result.error.issues }
    }
    const elements = result.data.elements.map(({ code, ...element }) => ({
        ...element,
        roomId: room.id,
        label: element.label || null,
        tableId: code?.trim() || null
    }))
    const codes = elements.flatMap(element => element.tableId ? [element.tableId] : [])

    // El UNIQUE de table_id también lo impide, pero así el mensaje dice dónde está
    const taken = codes.length === 0 ? [] : await db
        .select({ code: roomElements.tableId, room: rooms.name })
        .from(roomElements)
        .innerJoin(rooms, eq(roomElements.roomId, rooms.id))
        .where(and(inArray(roomElements.tableId, codes), ne(roomElements.roomId, room.id)))
    if (taken.length) {
        return { errors: taken.map(t => ({ message: `El código ${t.code} ya está en la sala ${t.room}` })) }
    }

    try {
        await db.transaction(async (tx) => {
            const previous = await tx.select({ code: roomElements.tableId })
                .from(roomElements)
                .where(and(eq(roomElements.roomId, room.id), isNotNull(roomElements.tableId)))
            const removed = previous.flatMap(p => p.code && !codes.includes(p.code) ? [p.code] : [])

            await tx.delete(roomElements).where(eq(roomElements.roomId, room.id))
            if (removed.length) await tx.delete(tables).where(and(inArray(tables.id, removed), hasNoOrders()))
            // Un código que ya existía sin estar en ningún plano (un QR ya impreso) se reutiliza
            if (codes.length) await tx.insert(tables).values(codes.map(code => ({ id: code }))).onConflictDoNothing()

            await tx.update(rooms)
                .set({ name: result.data.name, outline: result.data.outline })
                .where(eq(rooms.id, room.id))
            if (elements.length) await tx.insert(roomElements).values(elements)
        })
    } catch (error) {
        console.log(error)
        return { errors: [{ message: 'No se pudo guardar la sala' }] }
    }

    revalidateRooms()
    return { success: true }
}

export type DeleteRoomResponse = RoomActionResponse | { success: true }

// Las mesas de la sala se dan de baja con ella
export async function deleteRoom(id: number): Promise<DeleteRoomResponse> {
    const roomId = RoomIdSchema.safeParse(id)
    const room = roomId.success ? await findRoom(roomId.data) : null
    if (!room) {
        return { errors: [{ message: 'La sala no existe' }] }
    }

    try {
        await db.transaction(async (tx) => {
            const linked = await tx.select({ code: roomElements.tableId })
                .from(roomElements)
                .where(and(eq(roomElements.roomId, room.id), isNotNull(roomElements.tableId)))
            const codes = linked.flatMap(l => l.code ? [l.code] : [])
            await tx.delete(rooms).where(eq(rooms.id, room.id))
            if (codes.length) await tx.delete(tables).where(and(inArray(tables.id, codes), hasNoOrders()))
        })
    } catch (error) {
        console.log(error)
        return { errors: [{ message: 'No se pudo borrar la sala' }] }
    }

    revalidateRooms()
    return { success: true }
}
