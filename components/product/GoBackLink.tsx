import Link from "next/link"

type GoBackLinkProps = {
    href?: string
    text?: string
}

export default function GoBackLink({ href = '/admin/products', text = 'Volver a productos' }: GoBackLinkProps) {
    return (
        <Link
            href={href}
            className="inline-block my-5 py-2 px-6 rounded border-2 border-black font-bold uppercase"
        >
            ← {text}
        </Link>
    )
}
