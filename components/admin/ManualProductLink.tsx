'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PencilSquareIcon } from '@heroicons/react/24/outline'
import { tabClassName } from '@/components/order/CategoryTab'

export const MANUAL_PRODUCT_PATH = '/admin/quiosco/manual-product'

// Primera pestaña de la barra de categorías del quiosco de admin, con el mismo aspecto que CategoryTab.
// El pedido para una mesa de una sala lo usa con su propia ruta
export default function ManualProductLink({ href = MANUAL_PRODUCT_PATH }: { href?: string }) {
    const active = usePathname() === href
    return (
        <Link
            href={href}
            aria-current={active ? 'page' : undefined}
            className={tabClassName(active)}
        >
            <PencilSquareIcon className='size-12 md:size-14 p-1' aria-hidden='true' />
            <span className='text-sm md:text-base font-bold text-center leading-tight'>Producto manual</span>
        </Link>
    )
}
