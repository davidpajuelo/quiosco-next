'use client'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import Image from 'next/image'
import { toast } from 'react-toastify'
import type { Category, Product } from '@/src/generated/prisma/client'
import type { ProductActionResponse } from '@/actions/product-actions'
import { PRODUCT_IMAGE_TYPES, ProductImageSchema, ProductSchema, hasImage } from '@/src/schema'
import { getImagePath } from '@/src/utils'
import ProductPriceInput from './ProductPriceInput'

type ProductFormProps = {
    // Si todo va bien la acción redirige al listado; si no, devuelve los errores
    action: (formData: FormData) => Promise<ProductActionResponse>
    categories: Category[]
    // Sin producto es el formulario de alta
    product?: Product
}

export default function ProductForm({ action, categories, product }: ProductFormProps) {
    const currentImage = product ? getImagePath(product.image) : null
    const [preview, setPreview] = useState<string | null>(currentImage)
    const [pending, setPending] = useState(false)

    // Libera la URL temporal de la imagen elegida al cambiarla o salir
    useEffect(() => {
        if (!preview?.startsWith('blob:')) return
        return () => URL.revokeObjectURL(preview)
    }, [preview])

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) {
            setPreview(currentImage)
            return
        }
        const result = ProductImageSchema.safeParse(file)
        if (!result.success) {
            result.error.issues.forEach(issue => toast.error(issue.message))
            e.target.value = ''
            setPreview(currentImage)
            return
        }
        setPreview(URL.createObjectURL(file))
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const result = ProductSchema.safeParse({
            name: formData.get('name'),
            price: formData.get('price'),
            categoryId: formData.get('categoryId')
        })
        const image = formData.get('image')
        const imageResult = product && !hasImage(image) ? null : ProductImageSchema.safeParse(image)
        const issues = [
            ...(result.success ? [] : result.error.issues),
            ...(imageResult && !imageResult.success ? imageResult.error.issues : [])
        ]
        if (issues.length) {
            issues.forEach(issue => toast.error(issue.message))
            return
        }

        setPending(true)
        const response = await action(formData)
        // Solo vuelve aquí si hay errores; si no, la acción redirige al listado
        if (response?.errors) {
            response.errors.forEach(issue => toast.error(issue.message))
            setPending(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="bg-white p-5 shadow max-w-3xl space-y-5">
            <div className="space-y-2">
                <label htmlFor="name" className="block text-lg font-bold">Nombre</label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    defaultValue={product?.name}
                    maxLength={100}
                    required
                    className="border border-gray-200 p-2 w-full"
                />
            </div>

            <ProductPriceInput defaultPrice={product?.price} />

            <div className="space-y-2">
                <label htmlFor="categoryId" className="block text-lg font-bold">Categoría</label>
                <select
                    id="categoryId"
                    name="categoryId"
                    defaultValue={product?.categoryId ?? ''}
                    required
                    className="border border-gray-200 p-2 w-full bg-white"
                >
                    <option value="" disabled>-- Selecciona una categoría --</option>
                    {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label htmlFor="image" className="block text-lg font-bold">Imagen</label>
                {preview && (
                    <div className="relative w-48 h-60 border border-gray-200">
                        <Image
                            src={preview}
                            alt={product ? `Imagen de ${product.name}` : 'Vista previa de la imagen'}
                            fill
                            sizes="192px"
                            className="object-cover"
                            unoptimized={preview.startsWith('blob:')}
                        />
                    </div>
                )}
                <input
                    id="image"
                    name="image"
                    type="file"
                    accept={PRODUCT_IMAGE_TYPES.join(',')}
                    onChange={handleImageChange}
                    required={!product}
                    aria-describedby="image-help"
                    className="block w-full"
                />
                <p id="image-help" className="text-sm text-gray-600">
                    JPG, PNG o WEBP, de 4 MB como máximo.
                    {product && ' Si no eliges otra, se mantiene la imagen actual.'}
                </p>
            </div>

            <button
                type="submit"
                disabled={pending}
                className="py-3 rounded font-bold uppercase text-black bg-primary hover:bg-primary-dark w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {pending ? 'Guardando…' : product ? 'Guardar cambios' : 'Crear producto'}
            </button>
        </form>
    )
}
