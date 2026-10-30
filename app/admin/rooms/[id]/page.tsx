import { notFound } from 'next/navigation'
import { and, asc, eq, isNotNull, ne } from 'drizzle-orm'
import GoBackLink from '@/components/product/GoBackLink'
import RoomDesigner from '@/components/room/designer/RoomDesigner'
import type { RoomDoc } from '@/components/room/designer/layout'
import Heading from '@/components/ui/Heading'
import { db } from '@/src/db'
import { roomElements, rooms } from '@/src/db/schema'
import { RoomIdSchema } from '@/src/schema'

async function getRoom(id: string) {
  const roomId = RoomIdSchema.safeParse(id)
  if (!roomId.success) return null
  return db.query.rooms.findFirst({
    where: eq(rooms.id, roomId.data),
    with: {
      elements: { orderBy: [asc(roomElements.id)] }
    }
  })
}

// Códigos de mesa de las demás salas, para avisar en el editor antes de guardar
async function getTakenCodes(roomId: number) {
  const rows = await db.select({ code: roomElements.tableId, room: rooms.name })
    .from(roomElements)
    .innerJoin(rooms, eq(roomElements.roomId, rooms.id))
    .where(and(ne(roomElements.roomId, roomId), isNotNull(roomElements.tableId)))
  return Object.fromEntries(rows.map(row => [row.code!, row.room]))
}

export default async function RoomDesignerPage({ params }: { params: { id: string } }) {
  const room = await getRoom(params.id)
  if (!room) notFound()
  const takenCodes = await getTakenCodes(room.id)

  const initial: RoomDoc = {
    name: room.name,
    outline: room.outline,
    elements: room.elements.map(({ id, tableId, kind, shape, x, y, width, height, rotation, label }) => ({
      key: String(id),
      kind, shape, x, y, width, height, rotation, label,
      code: tableId
    }))
  }

  return (
    <>
      <Heading>Diseñar sala: {room.name}</Heading>
      <GoBackLink href="/admin/rooms" text="Volver a Crear/Editar Salas" />
      <RoomDesigner roomId={room.id} initial={initial} takenCodes={takenCodes} />
    </>
  )
}
