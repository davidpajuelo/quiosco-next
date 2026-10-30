'use client'
import { FormEvent, useState } from 'react'
import { toast } from 'react-toastify'
import { createRoom } from '@/actions/room-actions'
import { RoomNameSchema } from '@/src/schema'

export default function CreateRoomForm() {
    const [pending, setPending] = useState(false)

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const result = RoomNameSchema.safeParse(formData.get('name'))
        if (!result.success) {
            result.error.issues.forEach(issue => toast.error(issue.message))
            return
        }

        setPending(true)
        const response = await createRoom(formData)
        // Solo vuelve aquí si hay errores; si no, la acción redirige al diseñador
        if (response?.errors) {
            response.errors.forEach(issue => toast.error(issue.message))
            setPending(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="bg-white p-5 shadow flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 space-y-2">
                <label htmlFor="name" className="block text-lg font-bold">Nueva sala</label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    maxLength={60}
                    required
                    placeholder="Sala principal, Terraza…"
                    className="border border-gray-200 p-2 w-full"
                />
            </div>
            <button
                type="submit"
                disabled={pending}
                className="py-3 px-10 rounded font-bold uppercase text-black bg-primary hover:bg-primary-dark cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {pending ? 'Creando…' : 'Crear sala'}
            </button>
        </form>
    )
}
