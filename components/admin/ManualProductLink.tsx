'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PencilSquareIcon } from '@heroicons/react/24/outline'

export const MANUAL_PRODUCT_PATH = '/admin/quiosco/manual-product'

// Va al final de las categorías del quiosco de admin, con el mismo aspecto que CategoryIcon
export default function ManualProductLink() {
    const pathname = usePathname()
    return (
        <div className={`${pathname === MANUAL_PRODUCT_PATH ? 'bg-[#C65D3B]' : ''} flex items-center gap-4 w-full border-t border-gray-200 p-3
        last-of-type:border-b`}>
            <PencilSquareIcon className='size-16 p-2' aria-hidden='true' />
            <Link
                className='text-lg font-bold'
                href={MANUAL_PRODUCT_PATH}
            >Producto manual</Link>
        </div>
    )
}
