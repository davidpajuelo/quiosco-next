import { redirect } from "next/navigation"
import { db } from "@/src/db"
import Heading from "@/components/ui/Heading"

// Abre directamente la primera categoría
export default async function AdminKioskPage() {
  const category = await db.query.categories.findFirst()
  if (category) redirect(`/admin/quiosco/${category.slug}`)

  return <Heading>No hay categorías en el quiosco</Heading>
}
