'use client'
import { BackspaceIcon } from '@heroicons/react/24/outline'

// Hasta 999.999,99 €
const MAX_INTEGER_DIGITS = 6
const MAX_DECIMALS = 2

type Key = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '00' | ',' | 'C' | 'back'

// Teclado tipo calculadora, sin operaciones
const keys: Key[] = ['7', '8', '9', '4', '5', '6', '1', '2', '3', ',', '0', '00']

// Aplica una tecla al importe, guardado como texto con coma decimal ("12,5")
function pressKey(amount: string, key: Key) {
    if (key === 'C') return ''
    if (key === 'back') return amount.slice(0, -1)

    const [integer, decimals] = amount.split(',')
    if (key === ',') {
        if (decimals !== undefined) return amount
        return `${integer || '0'},`
    }

    if (decimals !== undefined) {
        return decimals.length + key.length <= MAX_DECIMALS ? amount + key : amount
    }
    // Sin ceros a la izquierda
    if (integer === '' || integer === '0') return key === '00' ? '0' : key
    return integer.length + key.length <= MAX_INTEGER_DIGITS ? amount + key : amount
}

// Convierte el importe tecleado ("12,5") en número
export function toPrice(amount: string) {
    return Number(amount.replace(',', '.')) || 0
}

// Muestra el importe tal y como se teclea, con separador de miles
function formatAmount(amount: string) {
    const [integer, decimals] = amount.split(',')
    const grouped = (integer || '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return decimals === undefined ? grouped : `${grouped},${decimals}`
}

type KeyManualProps = {
    label: string
    // Importe como texto con coma decimal, tal y como se teclea
    amount: string
    onChange: (amount: string) => void
}

// Key Manual: teclado para introducir importes a mano.
// Se usa para el precio de los productos manuales, el de la ficha del producto y el importe entregado (vueltas).
export default function KeyManual({ label, amount, onChange }: KeyManualProps) {
    const handleKey = (key: Key) => onChange(pressKey(amount, key))

    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <p className="text-lg font-bold">{label}</p>
                <output
                    aria-live="polite"
                    className="block bg-white border border-gray-100 p-3 text-right text-4xl text-[#C65D3B] tabular-nums"
                >
                    {formatAmount(amount)} €
                </output>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {keys.map(key => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => handleKey(key)}
                        className="bg-[var(--color-background-light)] hover:bg-gray-100 active:bg-gray-200 border border-gray-200 rounded py-4 text-2xl font-bold cursor-pointer"
                    >
                        {key}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={() => handleKey('C')}
                    aria-label="Borrar importe"
                    className="bg-[var(--color-background-light)] hover:bg-gray-100 active:bg-gray-200 border border-gray-200 rounded py-4 text-2xl font-bold text-red-600 cursor-pointer"
                >
                    C
                </button>
                <button
                    type="button"
                    onClick={() => handleKey('back')}
                    aria-label="Borrar último dígito"
                    className="col-span-2 flex items-center justify-center bg-[var(--color-background-light)] hover:bg-gray-100 active:bg-gray-200 border border-gray-200 rounded py-4 cursor-pointer"
                >
                    <BackspaceIcon className="size-8" />
                </button>
            </div>
        </div>
    )
}
