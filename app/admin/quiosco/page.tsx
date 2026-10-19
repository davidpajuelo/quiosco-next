import { redirect } from "next/navigation"
import { prisma } from "@/src/lib/prisma"
import Heading from "@/components/ui/Heading"

// Abre directamente la primera categoría
export default async function AdminKioskPage() {
  const category = await prisma.category.findFirst()
  if (category) redirect(`/admin/quiosco/${category.slug}`)

  return <Heading>No hay categorías en el quiosco</Heading>
}
