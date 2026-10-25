'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Barra de categorías fija en la parte superior; se desplaza en horizontal si no caben
export default function CategoryNav({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const scrollRef = useRef<HTMLDivElement>(null)

    // Al cambiar de pestaña, la centra en la barra
    useEffect(() => {
        scrollRef.current
            ?.querySelector('[aria-current="page"]')
            ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }, [pathname])

    return (
        <nav
            aria-label="Categorías"
            className="sticky top-0 z-40 bg-[var(--color-background-light)] shadow-md"
        >
            <div
                ref={scrollRef}
                className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {/* w-max + mx-auto: centradas si caben, desplazables si no */}
                <div className="flex w-max mx-auto">{children}</div>
            </div>
        </nav>
    )
}
