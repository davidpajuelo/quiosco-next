import Link from "next/link"
import { prisma } from "@/src/lib/prisma"
import { formatCurrency } from "@/src/utils"

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: { order?: string } }) {
  const order = searchParams.order
    ? await prisma.order.findUnique({
        where: {
          paycometOrder: searchParams.order
        }
      })
    : null

  return (
    <main className="p-5 text-center space-y-5 mt-20">
      {order ? (
        <>
          <h1 className="text-4xl">Gracias, {order.name}</h1>
          <p className="text-2xl">
            {/* El pago lo confirma la notificación de PAYCOMET, puede tardar unos segundos */}
            {order.paymentStatus === 'paid'
              ? `Pago de ${formatCurrency(order.total)} recibido`
              : 'Estamos confirmando tu pago'}
          </p>
        </>
      ) : (
        <h1 className="text-4xl">Pedido no encontrado</h1>
      )}
      <Link href="/order/cafe" className="inline-block py-2 px-5 rounded font-bold uppercase text-white bg-black">
        Volver al Quiosco
      </Link>
    </main>
  )
}
