import Link from "next/link"

export default function GoBackLink() {
    return (
        <Link
            href="/admin/products"
            className="inline-block my-5 py-2 px-6 rounded border-2 border-black font-bold uppercase"
        >
            ← Volver a productos
        </Link>
    )
}
