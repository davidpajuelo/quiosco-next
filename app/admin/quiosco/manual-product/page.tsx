import ManualProduct from "@/components/admin/ManualProduct"
import Heading from "@/components/ui/Heading"

// Productos que no están en la carta, con nombre e importe introducidos a mano
export default function ManualProductPage() {
  return (
    <>
      <Heading>Producto manual</Heading>
      <ManualProduct />
    </>
  )
}
