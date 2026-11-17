'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Fila de pestañas desplazable en horizontal (sin barra de scroll visible).
// Compartida por CategoryNav y la barra superior del admin
export default function ScrollTabs({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    const pathname = usePathname()
    const scrollRef = useRef<HTMLDivElement>(null)

    // Al cambiar de ruta, centra la pestaña activa en la barra
    useEffect(() => {
        scrollRef.current
            ?.querySelector('[aria-current="page"]')
            ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }, [pathname])

    return (
        <div
            ref={scrollRef}
            className={`overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
        >
            {/* w-max + mx-auto: centradas si caben, desplazables si no */}
            <div className="flex w-max mx-auto">{children}</div>
        </div>
    )
}
