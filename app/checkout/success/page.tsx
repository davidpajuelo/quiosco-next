import Link from "next/link"
import { db } from "@/src/db"
import { orders } from "@/src/db/schema"
import { formatCurrency } from "@/src/utils"
import { eq } from "drizzle-orm"

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: { session_id?: string } }) {
  const order = searchParams.session_id
    ? await db.query.orders.findFirst({
        where: eq(orders.stripeCheckoutSessionId, searchParams.session_id)
      })
    : null

  return (
    <main className="p-5 text-center space-y-5 mt-20">
      {order ? (
        <>
          <h1 className="text-4xl">Gracias, {order.name}</h1>
          <p className="text-2xl">
            {/* El pago lo confirma el webhook de Stripe, puede tardar unos segundos */}
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
