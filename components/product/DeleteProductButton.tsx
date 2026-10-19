'use client'
import { useState } from 'react'
import { TrashIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import { deleteProduct } from '@/actions/product-actions'

type DeleteProductButtonProps = {
    id: number
    name: string
}

export default function DeleteProductButton({ id, name }: DeleteProductButtonProps) {
    const [pending, setPending] = useState(false)

    const handleDelete = async () => {
        if (!window.confirm(`¿Borrar "${name}"? Esta acción no se puede deshacer.`)) return
        setPending(true)
        const response = await deleteProduct(id)
        setPending(false)
        if ('errors' in response) {
            response.errors.forEach(issue => toast.error(issue.message))
            return
        }
        toast.success(`${name} borrado`)
    }

    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            aria-label={`Borrar ${name}`}
            title="Borrar"
            className="p-1 rounded text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <TrashIcon className="size-6" aria-hidden="true" />
        </button>
    )
}
