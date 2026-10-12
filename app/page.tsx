import Link from "next/link";

export default function Home() {
  return (
    <main id="contenido" className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-lg rounded-leaf bg-paper p-10 text-center shadow-soft">
        <p className="text-5xl" aria-hidden="true">☕</p>
        <h1 className="mt-4 text-5xl font-black">Quiosco</h1>
        <p className="mt-4 text-lg text-bark-soft text-pretty">
          Café, dulces y mucho más, directo a tu mesa.
        </p>
        <Link href="/order" className="btn-primary mt-8">
          Empezar Pedido
        </Link>
      </div>
    </main>
  );
}
