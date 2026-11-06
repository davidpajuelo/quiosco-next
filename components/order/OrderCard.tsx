"use client"
import Link from "next/link"
import { toast } from "react-toastify"
import { completeOrder, uncompleteOrder } from "@/actions/complete-order.actions"
import type { OrderWithProducts, PaymentStatus } from "@/src/types"
import { formatCurrency } from "@/src/utils"
import { fromCents, remainingCents, toCents } from "@/src/utils/payments"

const paymentStatusLabels: Record<PaymentStatus, { label: string, className: string }> = {
    pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
    paid: { label: 'Pagado', className: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelado', className: 'bg-gray-200 text-gray-800' },
    refunded: { label: 'Reembolsado', className: 'bg-blue-100 text-blue-800' },
    payment_failed: { label: 'Pago fallido', className: 'bg-red-100 text-red-800' },
}

type orderCardProps = {
    order: OrderWithProducts
    // Pantalla de cobro de los pedidos Pendientes de pago (vista de Salas)
    payHref?: string
}
export default function OrderCard({ order, payHref }: orderCardProps) {
    // Pagado en parte con Dividir Pago: se muestra lo que queda
    const hasPaidLines = order.paymentStatus === 'pending' && order.orderProducts.some(line => line.paid)
    const remaining = fromCents(remainingCents(order))

    const handleCompleteOrder = async (formData: FormData) => {
        const response = await completeOrder(formData)
        if (response?.errors) {
            response.errors.forEach(issue => toast.error(issue.message))
            return
        }
        toast.success(({ closeToast }) => (
            <div className="flex items-center justify-between gap-3">
                <span>Orden {order.id} completada - Mesa: {order.tableId}, Nombre: {order.name}</span>
                <button
                    type="button"
                    className="bg-primary hover:bg-primary-dark text-black px-1 py-1 rounded font-bold text-sm cursor-pointer"
                    onClick={() => {
                        closeToast()
                        handleUndo()
                    }}
                >
                    Deshacer
                </button>
            </div>
        ))
    }

    const handleUndo = async () => {
        const response = await uncompleteOrder(order.id)
        if (response?.errors) {
            response.errors.forEach(issue => toast.error(issue.message))
            return
        }
        toast.info(`Orden ${order.id} de Mesa: ${order.tableId}, Nombre: ${order.name} marcada como pendiente`)
    }

    return (
        <section
            aria-labelledby="summary-heading"
            className="mt-16 rounded-lg  px-4 py-6 sm:p-6  lg:mt-0 lg:p-8 space-y-4"
        >
            <p className='text-3xl font-medium text-gray-900'>Nº Orden: { order.id } </p>
            <p className='text-2xl font-medium text-gray-900'>Nº Mesa: { order.tableId } </p>
            <p className='text-lg font-medium text-gray-900'>Cliente: {order.name}</p>
            <p className='text-lg font-medium text-gray-900'>Estado del Pago: {''}
                <span className={`px-2 py-1 rounded text-sm font-bold ${paymentStatusLabels[order.paymentStatus].className}`}>
                    {paymentStatusLabels[order.paymentStatus].label}
                </span>
            </p>
            <div className='text-lg font-medium text-gray-900'>Productos: 
                {order.orderProducts.map(product => (
                    <div key={product.id}
                    className="flex items-center gap-2 border-t border-grey-200 pt-4" >
                        <dt className="flex items-center text-sm text-grey-600">
                            <span>({product.quantity}) {''}</span>
                        </dt>
                        <dd className="text-sm font-medium text-gray-900" > { product.product?.name ?? product.name}</dd>
                        {product.paid && (
                            <dd className="ml-auto px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800 whitespace-nowrap">
                                Producto Pagado
                            </dd>
                        )}
                        </div>
                ))}
            </div>
            <dl className="mt-6 space-y-4">

                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <dt className="text-base font-medium text-gray-900">Total a Pagar: {formatCurrency(order.total)}</dt>
                    <dd className="text-base font-medium text-gray-900">{ }</dd>
                </div>
                {hasPaidLines && (
                    <>
                        <div className="flex items-center justify-between">
                            <dt className="text-base text-gray-700">Pagado</dt>
                            <dd className="text-base text-gray-700">{formatCurrency(fromCents(toCents(order.total) - toCents(remaining)))}</dd>
                        </div>
                        <div className="flex items-center justify-between font-bold text-red-700">
                            <dt>Pendiente de pago</dt>
                            <dd>{formatCurrency(remaining)}</dd>
                        </div>
                    </>
                )}
            </dl>

            {order.status ? (
                <p className="text-lg font-medium text-gray-900">Estado: <span className="font-bold">Completada</span></p>
            ) : (
                <form action={handleCompleteOrder}>
                    <input type="hidden" 
                    value={order.id}
                    name="order_id"/>
                    <input
                        type="submit"
                        className="bg-primary hover:bg-primary-dark text-black w-full mt-5 p-3 uppercase font-bold cursor-pointer"
                        value='Marcar Orden Completada'
                    />
                </form>
            )}

            {payHref && order.paymentStatus === 'pending' && (
                <Link
                    href={payHref}
                    className="block bg-green-600 hover:bg-green-700 text-white w-full p-3 uppercase font-bold text-center"
                >
                    Marcar como Pagado
                </Link>
            )}
        </section>
    )
}