'use client'
import { useRef, useState } from 'react'
import { formatCurrency } from '@/src/utils'
import { isAmountEnough } from '@/src/schema'
import KeyManual, { toPrice } from './KeyManual'

type AmountGivenProps = {
    total: number
    // Importe entregado como texto con coma decimal, tal y como se teclea en el Key Manual
    amount: string
    onChange: (amount: string) => void
}

// Vueltas a devolver, o null si lo entregado no cubre el total
function getChange(amount: string, total: number) {
    if (amount === '') return null
    const given = toPrice(amount)
    return isAmountEnough(given, total) ? Math.round((given - total) * 100) / 100 : null
}

// Importe entregado por el cliente en el quiosco de admin: se teclea en el Key Manual y calcula las vueltas
export default function AmountGiven({ total, amount, onChange }: AmountGivenProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    // Lo tecleado no se aplica hasta pulsar Aceptar
    const [draft, setDraft] = useState('')
    const change = getChange(amount, total)
    const draftChange = getChange(draft, total)

    const open = () => {
        setDraft(amount)
        dialogRef.current?.showModal()
    }
    const close = () => dialogRef.current?.close()
    const accept = () => {
        onChange(draft)
        close()
    }

    return (
        <div className='space-y-2'>
            <label htmlFor='amountGiven' className='block font-bold'>Importe entregado</label>
            <button
                id='amountGiven'
                type='button'
                onClick={open}
                aria-haspopup='dialog'
                className='block bg-white border border-gray-100 p-2 w-full text-left cursor-pointer'
            >
                {amount === '' ? <span className='text-gray-500'>Pulsa para introducirlo</span> : formatCurrency(toPrice(amount))}
            </button>

            <label htmlFor='change' className='block font-bold'>Vueltas</label>
            <output
                id='change'
                htmlFor='amountGiven'
                className='block bg-gray-100 border border-gray-100 p-2 w-full font-bold'
            >
                {change !== null ? formatCurrency(change) : '—'}
            </output>

            <dialog
                ref={dialogRef}
                aria-labelledby='key-manual-title'
                className='w-[calc(100%-2rem)] max-w-sm rounded p-5 backdrop:bg-black/50'
            >
                <div className='space-y-5'>
                    <div>
                        <h2 id='key-manual-title' className='text-2xl font-bold'>Key Manual</h2>
                        <p className='text-lg'>Total a pagar: <span className='font-bold'>{formatCurrency(total)}</span></p>
                    </div>

                    <KeyManual label='Importe entregado' amount={draft} onChange={setDraft} />

                    <p className='text-lg' aria-live='polite'>
                        Vueltas: <span className='font-bold'>{draftChange !== null ? formatCurrency(draftChange) : '—'}</span>
                    </p>
                    {draft !== '' && draftChange === null && (
                        <p className='text-sm text-red-600'>El Importe entregado es menor que el Total a pagar</p>
                    )}

                    <div className='grid grid-cols-2 gap-2'>
                        <button
                            type='button'
                            onClick={close}
                            className='py-3 rounded font-bold uppercase border-2 border-black cursor-pointer'
                        >
                            Cancelar
                        </button>
                        <button
                            type='button'
                            onClick={accept}
                            disabled={draftChange === null}
                            className='py-3 rounded font-bold uppercase text-black bg-primary hover:bg-primary-dark cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            Aceptar
                        </button>
                    </div>
                </div>
            </dialog>
        </div>
    )
}
