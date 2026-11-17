"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { KIOSK_PATH, TABLE_ORDER_PATH, useKioskNavStore } from "@/src/kiosk-nav-store";

type AdminRouteProps = {
    link: {
        url: string;
        text: string;
        blank: boolean;
        kiosk?: boolean;      // "Ver Quiosco": vuelve a la última categoría y muestra la barra de categorías
        tableOrder?: boolean; // "Salas": dentro del pedido de una mesa, muestra la barra de categorías
    }
    children?: React.ReactNode // icono
}

// Pestaña de la barra superior del admin, con el mismo acento que las de CategoryNav
export default function AdminRoute({ link, children }: AdminRouteProps) {
    const pathname = usePathname()
    const { lastPaths, setOpen } = useKioskNavStore()
    const active = pathname.startsWith(link.url)

    // Ya estamos en su quiosco: solo se vuelve a mostrar la barra, sin navegar
    // (se mantienen la categoría, el carrito y la mesa)
    const reopenInPlace = (link.kiosk && pathname.startsWith(KIOSK_PATH))
        || (link.tableOrder && TABLE_ORDER_PATH.test(pathname))

    // Desde otra sección, "Ver Quiosco" vuelve a la última categoría abierta con la barra visible
    const href = link.kiosk && lastPaths[KIOSK_PATH] ? lastPaths[KIOSK_PATH] : link.url

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (reopenInPlace) {
            e.preventDefault()
            setOpen(true)
        } else if (link.kiosk) {
            setOpen(true)
        }
    }

    return (
        <Link
            href={href}
            target={link.blank ? '_blank' : undefined}
            aria-current={active ? 'page' : undefined}
            onClick={handleClick}
            className={`flex items-center gap-2 shrink-0 px-4 py-3 border-b-4 font-bold whitespace-nowrap transition-colors
            ${active ? 'border-[#C65D3B] text-[#C65D3B]' : 'border-transparent hover:border-gray-300'}`}
        >
            {children}
            {link.text}
        </Link>
    )
}
