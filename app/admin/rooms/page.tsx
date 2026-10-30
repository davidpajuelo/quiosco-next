import Link from 'next/link'
import { PencilSquareIcon } from '@heroicons/react/24/outline'
import { and, asc, eq, isNull, ne } from 'drizzle-orm'
import CreateRoomForm from '@/components/room/CreateRoomForm'
import DeleteRoomButton from '@/components/room/DeleteRoomButton'
import Heading from '@/components/ui/Heading'
import { db } from '@/src/db'
import { roomElements, rooms, tables } from '@/src/db/schema'
import { ADMIN_TABLE_ID } from '@/src/lib/table-session'

async function getRooms() {
  return db.query.rooms.findMany({
    columns: { id: true, name: true },
    orderBy: [asc(rooms.id)],
    with: {
      elements: { columns: { kind: true } }
    }
  })
}

// Mesas dadas de alta (QR) que no están en ningún plano
async function getUnplacedTables() {
  return db.select({ id: tables.id })
    .from(tables)
    .leftJoin(roomElements, eq(roomElements.tableId, tables.id))
    .where(and(isNull(roomElements.id), ne(tables.id, ADMIN_TABLE_ID)))
    .orderBy(asc(tables.id))
}

export default async function RoomsPage() {
  const [roomList, unplaced] = await Promise.all([getRooms(), getUnplacedTables()])
  return (
    <>
      <Heading>Crear/Editar Salas</Heading>
      <div className="my-5 space-y-5">
        <CreateRoomForm />

        {unplaced.length > 0 && (
          <p className="text-sm text-gray-700">
            Mesas dadas de alta que no están en ningún plano: <strong>{unplaced.map(t => t.id).join(', ')}</strong>.
            Si pones en el plano una mesa o taburete con ese código, se reutiliza la mesa (y su QR).
          </p>
        )}

        {roomList.length === 0 ? (
          <p className="text-center my-10">Todavía no hay salas</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {roomList.map(room => {
              const tableCount = room.elements.filter(e => e.kind === 'table').length
              const stoolCount = room.elements.filter(e => e.kind === 'stool').length
              return (
                <li key={room.id} className="bg-white shadow p-5 flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/admin/rooms/${room.id}`} className="text-xl font-bold hover:underline">
                      {room.name}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">
                      {tableCount} {tableCount === 1 ? 'mesa' : 'mesas'} · {stoolCount} {stoolCount === 1 ? 'taburete' : 'taburetes'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/rooms/${room.id}`}
                      aria-label={`Diseñar ${room.name}`}
                      title="Diseñar"
                      className="p-1 rounded text-[#C65D3B] hover:bg-orange-50"
                    >
                      <PencilSquareIcon className="size-6" aria-hidden="true" />
                    </Link>
                    <DeleteRoomButton id={room.id} name={room.name} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
