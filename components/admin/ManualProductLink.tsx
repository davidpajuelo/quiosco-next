'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PencilSquareIcon } from '@heroicons/react/24/outline'

export const MANUAL_PRODUCT_PATH = '/admin/quiosco/manual-product'

// Va al final de las categorías del quiosco de admin, con el mismo aspecto que CategoryIcon.
// El pedido para una mesa de una sala lo usa con su propia ruta
export default function ManualProductLink({ href = MANUAL_PRODUCT_PATH }: { href?: string }) {
    const pathname = usePathname()
    return (
        <div className={`${pathname === href ? 'bg-[#C65D3B]' : ''} flex items-center gap-4 w-full border-t border-gray-200 p-3
        last-of-type:border-b`}>
            <PencilSquareIcon className='size-16 p-2' aria-hidden='true' />
            <Link
                className='text-lg font-bold'
                href={href}
            >Producto manual</Link>
        </div>
    )
}
