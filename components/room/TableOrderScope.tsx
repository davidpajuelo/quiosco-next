'use client'
import { useEffect } from 'react'
import { useStore } from '@/src/store'

// El carrito es global: se vacía al empezar el pedido de una mesa y al salir,
// para no mezclarlo con el del quiosco ni con el de otra mesa
export default function TableOrderScope({ code }: { code: string }) {
    const clearOrder = useStore((state) => state.clearOrder)
    useEffect(() => {
        clearOrder()
        return () => clearOrder()
    }, [code, clearOrder])
    return null
}
