'use client'
import type { Category } from '@/src/types'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import React from 'react'
import Image from "next/image"

type CategoryIconProps = {
    category: Category
    basePath?: string
}

export default function CategoryIcon({ category, basePath = '/order' }: CategoryIconProps) {
    const params = useParams<{category: string}>(

    )
    return (
        <div className={`${category.slug === params.category ? 'bg-[#C65D3B]': ''} flex items-center gap-4 w-full border-t border-gray-200 p-3
        last-of-type:border-b`}>
            <div className='relative size-16 '>
                <Image
                    src={`/icon_${category.slug}.png`}
                    alt={`Imagen de la Categoría: ${category.name}`}
                    fill
                />
            </div>
            <Link
                className='text-lg font-bold'
                href={`${basePath}/${category.slug}`}
            >{category.name}</Link>
        </div>
    )
}
