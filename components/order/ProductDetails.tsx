import { formatCurrency } from "@/src/utils"
import { OrderItem } from "@/src/types"
import { XCircleIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useStore } from "@/src/store"


type ProductDetailsProps = {
    item: OrderItem
    // Pedido ya hecho (cobro en Salas): sin botones para cambiar cantidades
    readOnly?: boolean
    // Dividir Pago: cantidad elegida para pagar (0 = sin elegir) con casilla y, si hay más de una,
    // botones para elegir cuántas (implica readOnly)
    selectable?: { quantity: number, onChange: (quantity: number) => void }
}

export default function ProductDetails({ item, readOnly: readOnlyProp = false, selectable }: ProductDetailsProps) {
    const readOnly = readOnlyProp || !!selectable
    const selected = selectable?.quantity ?? 0
    const increaseQuantity = useStore((state)=> state.increaseQuantity)
    const decreaseQuantity = useStore((state)=> state.decreaseQuantity)
    const removeItem = useStore((state)=> state.removeItem)
    return (
        <div className={`shadow space-y-1 p-4  border-t border-gray-200 ${selected > 0 ? 'bg-gray-50 ring-2 ring-inset ring-[var(--color-primary)]' : ''}`}>
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    {selectable ? (
                        <label className="flex flex-1 items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selected > 0}
                                // Al marcarla se eligen todas; luego se puede bajar la cantidad
                                onChange={() => selectable.onChange(selected > 0 ? 0 : item.quantity)}
                                className="mt-1 size-6 shrink-0 accent-black cursor-pointer"
                            />
                            <span className="text-xl font-bold">{item.name}</span>
                        </label>
                    ) : (
                        <p className="text-xl font-bold">{item.name} </p>
                    )}

                    {!readOnly && (
                        <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                        >
                            <XCircleIcon className="text-red-600 h-8 w-8" />
                        </button>
                    )}
                </div>
                <p className="text-2xl text-[#C65D3B]">
                    {formatCurrency(item.price)}
                </p>
                {readOnly ? (
                    <p className="text-lg">Cantidad: {item.quantity}</p>
                ) : (
                <div className="flex gap-5 px-10 py-2 bg-gray-100 w-fit rounded-lg">
                    <button
                        type="button"
                        onClick={() => decreaseQuantity(item.id)}
                    >
                        <MinusIcon className="h-6 w-6" />
                    </button>

                    <p className="text-lg ">
                        {item.quantity}
                    </p>

                    <button
                        type="button"
                        onClick={() => increaseQuantity(item.id)}
                    >
                        <PlusIcon className="h-6 w-6" />
                    </button>
                </div>
                )}
                {selectable && item.quantity > 1 && (
                    <div className="flex items-center gap-3">
                        <span className="text-lg font-bold">A pagar:</span>
                        <div className="flex items-center gap-5 px-5 py-2 bg-gray-100 w-fit rounded-lg">
                            <button
                                type="button"
                                aria-label={`Pagar una ${item.name} menos`}
                                onClick={() => selectable.onChange(selected - 1)}
                                disabled={selected === 0}
                                className="disabled:opacity-30"
                            >
                                <MinusIcon className="h-6 w-6" />
                            </button>
                            <p className="text-lg" aria-live="polite">{selected} de {item.quantity}</p>
                            <button
                                type="button"
                                aria-label={`Pagar una ${item.name} más`}
                                onClick={() => selectable.onChange(selected + 1)}
                                disabled={selected === item.quantity}
                                className="disabled:opacity-30"
                            >
                                <PlusIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                )}
                <p className="text-xl text-gray-700">
                    Subtotal: {''}
                    <span className="font-normal">
                        {formatCurrency(item.subtotal)}
                    </span>
                </p>
                {selected > 0 && selected < item.quantity && (
                    <p className="text-xl font-bold">
                        A pagar: {formatCurrency(item.price * selected)}
                    </p>
                )}
            </div>
        </div>
    )
}
