import { db } from "@/src/db"
import Heading from "@/components/ui/Heading"

// Pantalla de inicio del quiosco de admin: solo aquí se ve la barra de categorías.
// Al elegir una, la barra se oculta; "Ver Quiosco" vuelve a esta pantalla
export default async function AdminKioskPage() {
  const category = await db.query.categories.findFirst()

  return (
    <Heading>
      {category ? "Elige una categoría" : "No hay categorías en el quiosco"}
    </Heading>
  )
}
