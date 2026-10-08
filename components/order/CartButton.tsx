'use client'
import { useEffect, useState } from 'react'
import { useStore } from '@/src/store'

export default function CartButton() {
    const order = useStore((state) => state.order)
    const [summaryVisible, setSummaryVisible] = useState(false)
    const count = order.reduce((total, item) => total + item.quantity, 0)

    // Oculta el botón cuando ya se está viendo el pedido
    useEffect(() => {
        const summary = document.getElementById('pedido')
        if (!summary) return
        const observer = new IntersectionObserver(
            ([entry]) => setSummaryVisible(entry.isIntersecting),
            { threshold: 0.1 }
        )
        observer.observe(summary)
        return () => observer.disconnect()
    }, [])

    if (count === 0 || summaryVisible) return null

    return (
        <button
            type="button"
            onClick={() => document.getElementById('pedido')?.scrollIntoView({ behavior: 'smooth' })}
            aria-label={`Ver mi pedido, ${count} productos`}
            className="md:hidden fixed bottom-5 right-5 z-50 size-16 rounded-full bg-amber-400 shadow-lg flex items-center justify-center"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                aria-hidden="true"
                className="size-8"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            <span className="absolute -top-1 -right-1 min-w-6 h-6 px-1 rounded-full bg-black text-white text-sm font-bold flex items-center justify-center">
                {count}
            </span>
        </button>
    )
}
