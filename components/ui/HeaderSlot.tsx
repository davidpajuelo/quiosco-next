'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const HEADER_SLOT_ID = 'header-slot'

// Hueco superpuesto a la cabecera (Logo): ocupa todo su alto y ancho sin cambiar su estilo.
// Debe ir junto al <Logo> dentro de un contenedor con position: relative
export function HeaderSlot() {
    return <div id={HEADER_SLOT_ID} className="pointer-events-none absolute inset-0" />
}

// Lleva su contenido al hueco de la cabecera desde cualquier página o layout anidado
export function HeaderPortal({ children }: { children: React.ReactNode }) {
    const [target, setTarget] = useState<HTMLElement | null>(null)

    useEffect(() => {
        setTarget(document.getElementById(HEADER_SLOT_ID))
    }, [])

    if (!target) return null
    return createPortal(
        <div className="pointer-events-auto flex h-full items-center justify-between gap-3 px-3 md:px-5">
            {children}
        </div>,
        target
    )
}
