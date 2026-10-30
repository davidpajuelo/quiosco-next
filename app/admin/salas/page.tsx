import Link from 'next/link'
import { redirect } from 'next/navigation'
import { asc } from 'drizzle-orm'
import Heading from '@/components/ui/Heading'
import { db } from '@/src/db'
import { rooms } from '@/src/db/schema'

export const dynamic = 'force-dynamic'

// Abre directamente la primera sala
export default async function SalasPage() {
  const room = await db.query.rooms.findFirst({ columns: { id: true }, orderBy: [asc(rooms.id)] })
  if (room) redirect(`/admin/salas/${room.id}`)

  return (
    <>
      <Heading>Salas</Heading>
      <p className="my-10 text-center">
        Todavía no hay salas. Créalas en <Link href="/admin/rooms" className="font-bold underline">Crear/Editar Salas</Link>.
      </p>
    </>
  )
}
