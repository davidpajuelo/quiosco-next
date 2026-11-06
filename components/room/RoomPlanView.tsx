'use client'
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { RoomLayoutElement } from '@/src/schema'
import type { RoomPoint, TableOrderStats } from '@/src/types'
import { fitView, isTableKind } from './designer/layout'
import { PlanDefs, PlanLabel, PlanOutline, PlanShape, sortByLayer } from './plan'

// Los pedidos de los clientes llegan desde el QR: se recarga el plano cada poco
const REFRESH_MS = 30_000

const BUSY_FILL = '#C65D3B'
// Aviso de pedidos completados pero sin pagar, en la esquina izquierda
const UNPAID_FILL = '#dc2626'

type RoomPlanViewProps = {
    outline: RoomPoint[]
    elements: (RoomLayoutElement & { id: number })[]
    // Resumen de pedidos por código de mesa
    stats: Record<string, TableOrderStats>
    selectedCode: string | null
}

export default function RoomPlanView({ outline, elements, stats, selectedCode }: RoomPlanViewProps) {
    const router = useRouter()
    const pathname = usePathname()
    const svgRef = useRef<SVGSVGElement>(null)
    const [size, setSize] = useState({ w: 800, h: 600 })
    const view = useMemo(() => fitView(outline, elements), [outline, elements])

    useEffect(() => {
        const svg = svgRef.current
        if (!svg) return
        const observer = new ResizeObserver(([entry]) => {
            setSize({ w: entry.contentRect.width || 1, h: entry.contentRect.height || 1 })
        })
        observer.observe(svg)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        const timer = setInterval(() => router.refresh(), REFRESH_MS)
        return () => clearInterval(timer)
    }, [router])

    const k = Math.max(view.w / size.w, view.h / size.h)

    const select = (code: string) => {
        const next = code === selectedCode ? pathname : `${pathname}?mesa=${encodeURIComponent(code)}`
        router.push(next, { scroll: false })
    }

    const handleKeyDown = (e: KeyboardEvent, code: string) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        select(code)
    }

    return (
        <svg
            ref={svgRef}
            viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
            className="w-full h-full select-none bg-white"
            role="group"
            aria-label="Plano de la sala"
        >
            <PlanDefs k={k} />
            <rect x={view.x} y={view.y} width={view.w} height={view.h} fill="url(#grid)" />
            <PlanOutline outline={outline} />

            {sortByLayer(elements).map(element => {
                const code = isTableKind(element.kind) ? element.code : null
                if (!code) {
                    return (
                        <g key={element.id} pointerEvents="none">
                            <PlanShape element={element} stroke="#1f2937" strokeWidth={k} />
                            {element.label && <PlanLabel element={element} text={element.label} k={k} />}
                        </g>
                    )
                }

                const count = stats[code]?.open ?? 0
                const unpaid = stats[code]?.unpaidCompleted ?? 0
                const isSelected = code === selectedCode
                const top = element.y - element.height / 2
                const badge = { x: element.x + element.width / 2, y: top, r: 9 * k }
                const unpaidBadge = { x: element.x - element.width / 2, y: top, r: 9 * k }
                const description = [
                    count === 0 ? 'sin pedidos pendientes' : count === 1 ? '1 pedido pendiente' : `${count} pedidos pendientes`,
                    ...(unpaid ? [unpaid === 1 ? '1 pedido completado sin pagar' : `${unpaid} pedidos completados sin pagar`] : [])
                ].join(', ')
                return (
                    <g
                        key={element.id}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        aria-label={`Mesa ${code}: ${description}`}
                        onClick={() => select(code)}
                        onKeyDown={e => handleKeyDown(e, code)}
                        className="cursor-pointer outline-none focus-visible:opacity-80"
                    >
                        <PlanShape
                            element={element}
                            fill={count ? BUSY_FILL : undefined}
                            stroke={isSelected ? '#2563eb' : '#1f2937'}
                            strokeWidth={(isSelected ? 3 : 1) * k}
                        />
                        <PlanLabel element={element} text={code} k={k} fill={count ? '#ffffff' : undefined} />
                        {count > 0 && <PlanBadge {...badge} k={k} fill="#1f2937" value={count} />}
                        {unpaid > 0 && <PlanBadge {...unpaidBadge} k={k} fill={UNPAID_FILL} value={unpaid} />}
                    </g>
                )
            })}
        </svg>
    )
}

type PlanBadgeProps = { x: number, y: number, r: number, k: number, fill: string, value: number }

// Contador en una esquina de la mesa
function PlanBadge({ x, y, r, k, fill, value }: PlanBadgeProps) {
    return (
        <g pointerEvents="none">
            <circle cx={x} cy={y} r={r} fill={fill} stroke="#ffffff" strokeWidth={1.5 * k} />
            <text
                x={x}
                y={y}
                fontSize={11 * k}
                textAnchor="middle"
                dominantBaseline="central"
                fontWeight="bold"
                fill="#ffffff"
            >
                {value}
            </text>
        </g>
    )
}
