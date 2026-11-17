'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import ScrollTabs from '@/components/ui/ScrollTabs'
import { useKioskNavStore } from '@/src/kiosk-nav-store'

type CategoryNavProps = {
    children: React.ReactNode
    // Ruta base del quiosco (admin o pedido de una mesa). Si se indica, la barra se oculta al elegir
    // una categoría y solo vuelve a verse en esa ruta o al pulsar "Ver Quiosco" / "Salas"
    // (manteniendo la categoría elegida)
    collapsibleAt?: string
}

// Barra de categorías fija en la parte superior; se desplaza en horizontal si no caben
export default function CategoryNav({ children, collapsibleAt }: CategoryNavProps) {
    const pathname = usePathname()
    const { open, setOpen, setLastPath } = useKioskNavStore()

    // Recuerda la categoría abierta para que "Ver Quiosco" vuelva a ella
    useEffect(() => {
        if (collapsibleAt && pathname.startsWith(`${collapsibleAt}/`)) setLastPath(collapsibleAt, pathname)
    }, [collapsibleAt, pathname, setLastPath])

    if (collapsibleAt && !open && pathname !== collapsibleAt) return null

    // Al pulsar cualquier pestaña, la barra se oculta.
    // Debe ser onClick (fase de burbuja) y NO onClickCapture: así el onClick del <Link> se ejecuta antes,
    // hace preventDefault y navega en cliente. Si la barra se desmonta antes, el navegador hace una
    // navegación completa (recarga) y se pierde el carrito, que solo vive en memoria (zustand)
    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
        if (collapsibleAt && (e.target as HTMLElement).closest('a')) setOpen(false)
    }

    return (
        <nav
            aria-label="Categorías"
            className="sticky top-0 z-40 bg-[var(--color-background-light)] shadow-md"
            onClick={handleClick}
        >
            <ScrollTabs>{children}</ScrollTabs>
        </nav>
    )
}
