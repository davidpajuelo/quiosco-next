'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function CategoryDrawer({ children }: { children: React.ReactNode }) {
    const params = useParams<{ category?: string }>()
    const category = params.category
    // Abierto si aún no se ha elegido categoría; se cierra al elegir una
    const [open, setOpen] = useState(!category)

    useEffect(() => {
        setOpen(!category)
    }, [category])

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(prev => !prev)}
                aria-expanded={open}
                aria-controls="categorias"
                className="md:hidden w-full flex items-center justify-between bg-amber-400 px-5 py-3 font-bold text-lg"
            >
                Categorías
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                    className={`size-6 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </button>

            <div
                id="categorias"
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out md:grid-rows-[1fr] ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
                <div className="overflow-hidden">{children}</div>
            </div>
        </>
    )
}
