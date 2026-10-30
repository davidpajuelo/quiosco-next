'use client'
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { RoomLayoutElement } from '@/src/schema'
import type { RoomPoint } from '@/src/types'
import { fitView, isTableKind } from './designer/layout'
import { PlanDefs, PlanLabel, PlanOutline, PlanShape, sortByLayer } from './plan'

// Los pedidos de los clientes llegan desde el QR: se recarga el plano cada poco
const REFRESH_MS = 30_000

const BUSY_FILL = '#C65D3B'

type RoomPlanViewProps = {
    outline: RoomPoint[]
    elements: (RoomLayoutElement & { id: number })[]
    // Pedidos pendientes por código de mesa
    pending: Record<string, number>
    selectedCode: string | null
}

export default function RoomPlanView({ outline, elements, pending, selectedCode }: RoomPlanViewProps) {
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

                const count = pending[code] ?? 0
                const isSelected = code === selectedCode
                const badge = { x: element.x + element.width / 2, y: element.y - element.height / 2, r: 9 * k }
                return (
                    <g
                        key={element.id}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        aria-label={`Mesa ${code}: ${count === 0 ? 'sin pedidos pendientes' : count === 1 ? '1 pedido pendiente' : `${count} pedidos pendientes`}`}
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
                        {count > 0 && (
                            <g pointerEvents="none">
                                <circle cx={badge.x} cy={badge.y} r={badge.r} fill="#1f2937" stroke="#ffffff" strokeWidth={1.5 * k} />
                                <text
                                    x={badge.x}
                                    y={badge.y}
                                    fontSize={11 * k}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontWeight="bold"
                                    fill="#ffffff"
                                >
                                    {count}
                                </text>
                            </g>
                        )}
                    </g>
                )
            })}
        </svg>
    )
}
