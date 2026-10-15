import Link from "next/link"

export default function CheckoutCancelPage() {
  return (
    <main className="p-5 text-center space-y-5 mt-20">
      <h1 className="text-4xl">Pago no completado</h1>
      <p className="text-2xl">No se ha realizado ningún cargo</p>
      <Link href="/order/cafe" className="inline-block py-2 px-5 rounded font-bold uppercase text-white bg-black">
        Volver al Quiosco
      </Link>
    </main>
  )
}
