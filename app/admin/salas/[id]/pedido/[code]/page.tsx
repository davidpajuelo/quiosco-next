import { db } from "@/src/db"
import Heading from "@/components/ui/Heading"

// Al elegir la mesa, como en /admin/quiosco: se ve la barra de categorías para elegir una.
// Al elegirla, la barra se oculta; la pestaña "Salas" la vuelve a mostrar
export default async function TableKioskPage() {
  const category = await db.query.categories.findFirst()

  return (
    <Heading>
      {category ? "Elige una categoría" : "No hay categorías en el quiosco"}
    </Heading>
  )
}
