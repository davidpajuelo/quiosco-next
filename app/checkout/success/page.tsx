import Link from "next/link"
import { prisma } from "@/src/lib/prisma"
import { formatCurrency } from "@/src/utils"

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: { session_id?: string } }) {
  const order = searchParams.session_id
    ? await prisma.order.findUnique({
        where: {
          stripeCheckoutSessionId: searchParams.session_id
        }
      })
    : null

  return (
    <main className="p-5 text-center space-y-5 mt-20">
      {order ? (
        <>
          <h1 className="text-4xl font-black">Gracias, {order.name}</h1>
          <p className="text-2xl">
            {/* El pago lo confirma el webhook de Stripe, puede tardar unos segundos */}
            {order.paymentStatus === 'paid'
              ? `Pago de ${formatCurrency(order.total)} recibido`
              : 'Estamos confirmando tu pago'}
          </p>
        </>
      ) : (
        <h1 className="text-4xl font-black">Pedido no encontrado</h1>
      )}
      <Link href="/order/cafe" className="inline-block py-2 px-5 rounded font-bold uppercase text-white bg-black">
        Volver al Quiosco
      </Link>
    </main>
  )
}
