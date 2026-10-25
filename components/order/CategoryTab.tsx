'use client'
import type { Category } from '@/src/types'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'

type CategoryTabProps = {
    category: Category
    basePath?: string
}

// Estilo compartido por las pestañas de CategoryNav (también ManualProductLink del admin)
export function tabClassName(active: boolean) {
    return `flex flex-col items-center gap-1 shrink-0 w-24 md:w-28 px-2 pt-3 pb-2 border-b-4 transition-colors
    ${active ? 'border-[#C65D3B] text-[#C65D3B]' : 'border-transparent hover:border-gray-300'}`
}

// Pestaña de la barra superior de categorías (CategoryNav)
export default function CategoryTab({ category, basePath = '/order' }: CategoryTabProps) {
    const params = useParams<{ category?: string }>()
    const active = category.slug === params.category

    return (
        <Link
            href={`${basePath}/${category.slug}`}
            aria-current={active ? 'page' : undefined}
            className={tabClassName(active)}
        >
            <div className="relative size-12 md:size-14">
                <Image
                    src={`/icon_${category.slug}.png`}
                    alt=""
                    fill
                    sizes="56px"
                />
            </div>
            <span className="text-sm md:text-base font-bold text-center leading-tight">{category.name}</span>
        </Link>
    )
}
