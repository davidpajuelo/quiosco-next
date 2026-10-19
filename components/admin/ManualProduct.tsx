'use client'
import { FormEvent, useState } from 'react'
import { toast } from 'react-toastify'
import { useStore } from '@/src/store'
import { ManualProductSchema } from '@/src/schema'
import { formatCurrency } from '@/src/utils'
import KeyManual, { toPrice } from './KeyManual'

const DEFAULT_NAME = 'Varios'

export default function ManualProduct() {
    const addManualToOrder = useStore((state) => state.addManualToOrder)
    const [name, setName] = useState(DEFAULT_NAME)
    const [amount, setAmount] = useState('')

    const price = toPrice(amount)
    const nameIsEmpty = name.trim() === ''

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const result = ManualProductSchema.safeParse({ name, price })
        if (!result.success) {
            result.error.issues.forEach(issue => toast.error(issue.message))
            return
        }
        addManualToOrder(result.data.name, result.data.price)
        toast.success(`${result.data.name} (${formatCurrency(result.data.price)}) añadido al pedido`)
        setName(DEFAULT_NAME)
        setAmount('')
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-sm space-y-5">
            <div className="space-y-2">
                <label htmlFor="manual-name" className="block text-lg font-bold">
                    Nombre del producto
                </label>
                <input
                    id="manual-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    maxLength={100}
                    required
                    aria-invalid={nameIsEmpty}
                    aria-describedby={nameIsEmpty ? 'manual-name-error' : undefined}
                    className={`bg-white border p-2 w-full ${nameIsEmpty ? 'border-red-600' : 'border-gray-100'}`}
                />
                {nameIsEmpty && (
                    <p id="manual-name-error" className="text-sm text-red-600">
                        El nombre del producto es obligatorio
                    </p>
                )}
            </div>

            <KeyManual label="Importe" amount={amount} onChange={setAmount} />

            <button
                type="submit"
                disabled={nameIsEmpty || price <= 0}
                className="py-3 rounded font-bold uppercase text-black bg-primary hover:bg-primary-dark w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Añadir al pedido
            </button>
        </form>
    )
}
