"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminRouteProps = {
    link: {
        url: string;
        text: string;
        blank: boolean;
    }
    children?: React.ReactNode // icono
}

// Pestaña de la barra superior del admin, con el mismo acento que las de CategoryNav
export default function AdminRoute({ link, children }: AdminRouteProps) {
    const pathname = usePathname()
    const active = pathname.startsWith(link.url)
    return (
        <Link
            href={link.url}
            target={link.blank ? '_blank' : undefined}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-2 shrink-0 px-4 py-3 border-b-4 font-bold whitespace-nowrap transition-colors
            ${active ? 'border-[#C65D3B] text-[#C65D3B]' : 'border-transparent hover:border-gray-300'}`}
        >
            {children}
            {link.text}
        </Link>
    )
}
