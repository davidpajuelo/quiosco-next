'use client'
import { useRef, useState } from 'react'
import KeyManual, { toPrice } from '@/components/admin/KeyManual'
import { formatCurrency } from '@/src/utils'

type ProductPriceInputProps = {
    // Precio actual del producto; sin él es un alta
    defaultPrice?: number
}

// Pasa el precio guardado al formato del Key Manual ("12,5")
function toAmount(price?: number) {
    return price ? String(Math.round(price * 100) / 100).replace('.', ',') : ''
}

// Precio de la ficha del producto: se teclea en el Key Manual y viaja al FormData en un input oculto
export default function ProductPriceInput({ defaultPrice }: ProductPriceInputProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [amount, setAmount] = useState(() => toAmount(defaultPrice))
    // Lo tecleado no se aplica hasta pulsar Aceptar
    const [draft, setDraft] = useState('')

    const open = () => {
        setDraft(amount)
        dialogRef.current?.showModal()
    }
    const close = () => dialogRef.current?.close()
    const accept = () => {
        setAmount(draft)
        close()
    }

    return (
        <div className="space-y-2">
            <label htmlFor="price" className="block text-lg font-bold">Precio (€)</label>
            <button
                id="price"
                type="button"
                onClick={open}
                aria-haspopup="dialog"
                className="block border border-gray-200 p-2 w-full text-left cursor-pointer"
            >
                {amount === '' ? <span className="text-gray-500">Pulsa para introducirlo</span> : formatCurrency(toPrice(amount))}
            </button>
            <input type="hidden" name="price" value={amount === '' ? '' : String(toPrice(amount))} />

            <dialog
                ref={dialogRef}
                aria-labelledby="price-key-manual-title"
                className="w-[calc(100%-2rem)] max-w-sm rounded p-5 backdrop:bg-black/50"
            >
                <div className="space-y-5">
                    <h2 id="price-key-manual-title" className="text-2xl font-bold">Key Manual</h2>

                    <KeyManual label="Precio" amount={draft} onChange={setDraft} />

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={close}
                            className="py-3 rounded font-bold uppercase border-2 border-black cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={accept}
                            disabled={toPrice(draft) <= 0}
                            className="py-3 rounded font-bold uppercase text-black bg-primary hover:bg-primary-dark cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Aceptar
                        </button>
                    </div>
                </div>
            </dialog>
        </div>
    )
}
