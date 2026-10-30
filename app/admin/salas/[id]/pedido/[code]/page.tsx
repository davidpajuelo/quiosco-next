import { redirect } from "next/navigation"
import { db } from "@/src/db"
import Heading from "@/components/ui/Heading"

// Abre directamente la primera categoría, como /admin/quiosco
export default async function TableKioskPage({ params }: { params: { id: string, code: string } }) {
  const category = await db.query.categories.findFirst()
  if (category) redirect(`/admin/salas/${params.id}/pedido/${params.code}/${category.slug}`)

  return <Heading>No hay categorías en el quiosco</Heading>
}
