"use client"
import { useEffect, useRef, useState } from "react"
import { FunnelIcon, ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline"
import OrderCard from "./OrderCard"
import Heading from "@/components/ui/Heading"
import { OrderWithProducts } from "@/src/types"
import { formatCurrency } from "@/src/utils"

type Grouping = 'none' | 'table' | 'tableAndName'

const groupingOptions: { value: Grouping, label: string }[] = [
    { value: 'none', label: 'Sin agrupación' },
    { value: 'table', label: 'Mesa' },
    { value: 'tableAndName', label: 'Mesa y Nombre' },
]

type OrderGroup = {
    key: string
    label: string
    orders: OrderWithProducts[]
    total: number
}

function groupOrders(orders: OrderWithProducts[], grouping: Grouping): OrderGroup[] {
    const groups = new Map<string, OrderGroup>()
    orders.forEach(order => {
        const table = order.tableId ?? 'Sin mesa'
        const key = grouping === 'table' ? table : `${table}|${order.name}`
        const label = grouping === 'table' ? `Mesa: ${table}` : `Mesa: ${table} - ${order.name}`
        if (!groups.has(key)) groups.set(key, { key, label, orders: [], total: 0 })
        const group = groups.get(key)!
        group.orders.push(order)
        group.total += order.total
    })
    return Array.from(groups.values()).sort((a, b) =>
        a.key.localeCompare(b.key, 'es', { numeric: true, sensitivity: 'base' })
    )
}

type OrderListProps = {
    orders: OrderWithProducts[]
}

export default function OrderList({ orders }: OrderListProps) {
    const [grouping, setGrouping] = useState<Grouping>('none')
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isMenuOpen) return
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false)
        }
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsMenuOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isMenuOpen])

    const handleSelect = (value: Grouping) => {
        setGrouping(value)
        setIsMenuOpen(false)
    }

    const renderGrid = (list: OrderWithProducts[]) => (
        <div className='grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3'>
            {list.map(order => (
                <OrderCard
                    key={order.id}
                    order={order}
                />
            ))}
        </div>
    )

    return (
        <>
            <div className="flex items-center justify-between gap-4">
                <Heading>Administrar Pedidos</Heading>

                <div className="relative" ref={menuRef}>
                    <button
                        type="button"
                        aria-label="Agrupar pedidos"
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                        title="Agrupar pedidos"
                        className={`p-2 rounded hover:bg-gray-200 cursor-pointer ${grouping !== 'none' ? 'text-amber-500' : 'text-gray-700'}`}
                        onClick={() => setIsMenuOpen(open => !open)}
                    >
                        <FunnelIcon className="h-6 w-6" />
                    </button>

                    {isMenuOpen && (
                        <ul
                            role="menu"
                            className="absolute right-0 z-10 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5"
                        >
                            {groupingOptions.map(option => (
                                <li key={option.value} role="none">
                                    <button
                                        type="button"
                                        role="menuitemradio"
                                        aria-checked={grouping === option.value}
                                        className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => handleSelect(option.value)}
                                    >
                                        {option.label}
                                        {grouping === option.value && <CheckIcon className="h-4 w-4" />}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {orders.length ? (
                grouping === 'none' ? renderGrid(orders) : (
                    <div className="space-y-3 mt-4">
                        {groupOrders(orders, grouping).map(group => (
                            <details
                                key={`${grouping}-${group.key}`}
                                className="group rounded-lg border border-white "
                            >
                                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-lg font-medium text-gray-900 [&::-webkit-details-marker]:hidden">
                                    <span className="flex flex-wrap items-baseline gap-x-3">
                                        {group.label}
                                        <span className="text-base font-semibold text-black">Total: {formatCurrency(group.total)}</span>
                                    </span>
                                    <span className="flex items-center gap-2 text-sm text-black">
                                        {group.orders.length} {group.orders.length === 1 ? 'pedido' : 'pedidos'}
                                        <ChevronDownIcon className="h-5 w-5 transition-transform group-open:rotate-180" />
                                    </span>
                                </summary>
                                {renderGrid(group.orders)}
                            </details>
                        ))}
                    </div>
                )
            ) : <p className="text-center" ></p>}
        </>
    )
}
