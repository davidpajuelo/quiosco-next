'use client'
import { Dispatch, PointerEvent, SetStateAction, useEffect, useRef, useState } from 'react'
import type { RoomPoint } from '@/src/types'
import {
    type DesignerElement, type View, KIND_NAMES, MIN_SIZE, isInside, isTableKind, normalizeAngle, rotate, snap
} from './layout'
import { PlanDefs, PlanLabel, PlanOutline, PlanShape, sortByLayer } from '../plan'

type RoomCanvasProps = {
    outline: RoomPoint[]
    elements: DesignerElement[]
    selectedKey: string | null
    invalidKeys: Set<string>
    snapEnabled: boolean
    view: View
    setView: Dispatch<SetStateAction<View>>
    onSelect: (key: string | null) => void
    // Se llama una vez al empezar cada arrastre, para el historial de deshacer
    onBeginChange: () => void
    onElementChange: (key: string, patch: Partial<DesignerElement>) => void
    onOutlineChange: (outline: RoomPoint[]) => void
}

type Drag =
    | { type: 'move', key: string, dx: number, dy: number }
    | { type: 'rotate', key: string }
    | { type: 'resize', key: string }
    | { type: 'vertex', index: number }
    | { type: 'pan', clientX: number, clientY: number, start: View, unitsPerPx: number, moved: boolean }

export default function RoomCanvas({
    outline, elements, selectedKey, invalidKeys, snapEnabled, view, setView,
    onSelect, onBeginChange, onElementChange, onOutlineChange
}: RoomCanvasProps) {
    const svgRef = useRef<SVGSVGElement>(null)
    const drag = useRef<Drag | null>(null)
    const [size, setSize] = useState({ w: 800, h: 600 })

    useEffect(() => {
        const svg = svgRef.current
        if (!svg) return
        const observer = new ResizeObserver(([entry]) => {
            setSize({ w: entry.contentRect.width || 1, h: entry.contentRect.height || 1 })
        })
        observer.observe(svg)
        return () => observer.disconnect()
    }, [])

    // Zoom con la rueda, centrado en el puntero. Tiene que ser no pasivo para evitar el scroll de la página
    useEffect(() => {
        const svg = svgRef.current
        if (!svg) return
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault()
            const p = toPlan(svg, e.clientX, e.clientY)
            const factor = e.deltaY > 0 ? 1.1 : 1 / 1.1
            setView(v => {
                const w = Math.min(Math.max(v.w * factor, 100), 20000)
                const f = w / v.w
                return { x: p.x - (p.x - v.x) * f, y: p.y - (p.y - v.y) * f, w, h: v.h * f }
            })
        }
        svg.addEventListener('wheel', handleWheel, { passive: false })
        return () => svg.removeEventListener('wheel', handleWheel)
    }, [setView])

    // Centímetros por píxel de pantalla, para que asas y textos midan siempre lo mismo
    const k = Math.max(view.w / size.w, view.h / size.h)

    const startDrag = (e: PointerEvent, next: Drag) => {
        e.stopPropagation()
        svgRef.current?.setPointerCapture(e.pointerId)
        drag.current = next
    }

    const handleElementDown = (e: PointerEvent, element: DesignerElement) => {
        if (e.button !== 0) return
        const p = toPlan(svgRef.current!, e.clientX, e.clientY)
        onSelect(element.key)
        onBeginChange()
        startDrag(e, { type: 'move', key: element.key, dx: p.x - element.x, dy: p.y - element.y })
    }

    const handleHandleDown = (e: PointerEvent, type: 'rotate' | 'resize', key: string) => {
        if (e.button !== 0) return
        onBeginChange()
        startDrag(e, { type, key })
    }

    // El doble clic se detecta a mano: con la captura del puntero el dblclick no llega al vértice
    const lastVertexDown = useRef({ index: -1, time: 0 })

    const handleVertexDown = (e: PointerEvent, index: number) => {
        if (e.button !== 0) return
        const last = lastVertexDown.current
        lastVertexDown.current = { index, time: e.timeStamp }
        if (last.index === index && e.timeStamp - last.time < 350 && outline.length > 3) {
            e.stopPropagation()
            onBeginChange()
            onOutlineChange(outline.filter((_, i) => i !== index))
            return
        }
        onBeginChange()
        startDrag(e, { type: 'vertex', index })
    }

    // Arrastrar el punto medio de un lado crea un vértice nuevo
    const handleMidpointDown = (e: PointerEvent, index: number) => {
        if (e.button !== 0) return
        const a = outline[index]
        const b = outline[(index + 1) % outline.length]
        onBeginChange()
        onOutlineChange([
            ...outline.slice(0, index + 1),
            { x: snap((a.x + b.x) / 2, snapEnabled), y: snap((a.y + b.y) / 2, snapEnabled) },
            ...outline.slice(index + 1)
        ])
        startDrag(e, { type: 'vertex', index: index + 1 })
    }

    const handleBackgroundDown = (e: PointerEvent) => {
        if (e.button !== 0 && e.button !== 1) return
        const ctm = svgRef.current!.getScreenCTM()
        startDrag(e, {
            type: 'pan', clientX: e.clientX, clientY: e.clientY, start: view,
            unitsPerPx: ctm ? 1 / ctm.a : k, moved: false
        })
    }

    const handlePointerMove = (e: PointerEvent) => {
        const d = drag.current
        if (!d) return
        if (d.type === 'pan') {
            const dx = e.clientX - d.clientX
            const dy = e.clientY - d.clientY
            if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true
            setView({ ...d.start, x: d.start.x - dx * d.unitsPerPx, y: d.start.y - dy * d.unitsPerPx })
            return
        }

        const p = toPlan(svgRef.current!, e.clientX, e.clientY)
        if (d.type === 'vertex') {
            onOutlineChange(outline.map((v, i) => i === d.index ? { x: snap(p.x, snapEnabled), y: snap(p.y, snapEnabled) } : v))
            return
        }

        const element = elements.find(el => el.key === d.key)
        if (!element) return
        if (d.type === 'move') {
            onElementChange(d.key, { x: snap(p.x - d.dx, snapEnabled), y: snap(p.y - d.dy, snapEnabled) })
        } else if (d.type === 'rotate') {
            const angle = Math.atan2(p.y - element.y, p.x - element.x) * 180 / Math.PI + 90
            // Con Mayús gira libremente; si no, de 15 en 15 grados
            onElementChange(d.key, { rotation: normalizeAngle(e.shiftKey ? Math.round(angle) : Math.round(angle / 15) * 15) })
        } else {
            // Se redimensiona desde el centro, en los ejes del propio elemento
            const local = rotate({ x: p.x - element.x, y: p.y - element.y }, -element.rotation)
            const width = Math.max(MIN_SIZE, snap(Math.abs(local.x) * 2, snapEnabled))
            const height = Math.max(MIN_SIZE, snap(Math.abs(local.y) * 2, snapEnabled))
            onElementChange(d.key, element.shape === 'circle'
                ? { width: Math.max(width, height), height: Math.max(width, height) }
                : { width, height })
        }
    }

    const handlePointerUp = (e: PointerEvent) => {
        const d = drag.current
        drag.current = null
        if (svgRef.current?.hasPointerCapture(e.pointerId)) svgRef.current.releasePointerCapture(e.pointerId)
        // Un clic en el fondo sin arrastrar quita la selección
        if (d?.type === 'pan' && !d.moved) onSelect(null)
    }

    const sorted = sortByLayer(elements)
    const selected = elements.find(el => el.key === selectedKey)

    return (
        <svg
            ref={svgRef}
            viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
            className="w-full h-full touch-none select-none bg-white cursor-grab active:cursor-grabbing"
            onPointerDown={handleBackgroundDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            role="application"
            aria-label="Plano de la sala"
        >
            <PlanDefs k={k} />

            <rect x={view.x} y={view.y} width={view.w} height={view.h} fill="url(#grid)" />

            <PlanOutline outline={outline} />

            {outline.map((a, i) => {
                const b = outline[(i + 1) % outline.length]
                const length = Math.hypot(b.x - a.x, b.y - a.y)
                if (length < 1) return null
                return (
                    <text
                        key={`len-${i}`}
                        x={(a.x + b.x) / 2}
                        y={(a.y + b.y) / 2 - 10 * k}
                        fontSize={12 * k}
                        textAnchor="middle"
                        fill="#374151"
                        pointerEvents="none"
                    >
                        {(length / 100).toFixed(2)} m
                    </text>
                )
            })}

            {sorted.map(element => {
                const invalid = invalidKeys.has(element.key)
                const outside = !isInside(element, outline)
                const isSelected = element.key === selectedKey
                const stroke = invalid ? '#dc2626' : isSelected ? '#2563eb' : outside ? '#f59e0b' : '#1f2937'
                const text = isTableKind(element.kind) ? element.code : element.label
                return (
                    <g key={element.key} onPointerDown={e => handleElementDown(e, element)} className="cursor-move">
                        <title>{text || KIND_NAMES[element.kind]}</title>
                        <PlanShape
                            element={element}
                            stroke={stroke}
                            strokeWidth={(isSelected || invalid || outside ? 2.5 : 1) * k}
                            strokeDasharray={outside && !isSelected && !invalid ? `${6 * k} ${4 * k}` : undefined}
                        />
                        {text && <PlanLabel element={element} text={text} k={k} />}
                    </g>
                )
            })}

            {outline.map((a, i) => {
                const b = outline[(i + 1) % outline.length]
                return (
                    <g key={`mid-${i}`} onPointerDown={e => handleMidpointDown(e, i)} className="cursor-copy">
                        <title>Arrastra para añadir un vértice</title>
                        <circle cx={(a.x + b.x) / 2} cy={(a.y + b.y) / 2} r={5 * k} fill="#ffffff" stroke="#6b7280" strokeWidth={1.5 * k} />
                        <path
                            d={`M ${(a.x + b.x) / 2 - 3 * k} ${(a.y + b.y) / 2} h ${6 * k} M ${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - 3 * k} v ${6 * k}`}
                            stroke="#6b7280"
                            strokeWidth={1.5 * k}
                        />
                    </g>
                )
            })}

            {outline.map((p, i) => (
                <circle
                    key={`v-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={7 * k}
                    fill="#374151"
                    stroke="#ffffff"
                    strokeWidth={2 * k}
                    className="cursor-pointer"
                    onPointerDown={e => handleVertexDown(e, i)}
                >
                    <title>Arrastra para mover el vértice; doble clic para quitarlo</title>
                </circle>
            ))}

            {selected && <SelectionHandles element={selected} k={k} onHandleDown={handleHandleDown} />}
        </svg>
    )
}

type SelectionHandlesProps = {
    element: DesignerElement
    k: number
    onHandleDown: (e: PointerEvent, type: 'rotate' | 'resize', key: string) => void
}

function SelectionHandles({ element, k, onHandleDown }: SelectionHandlesProps) {
    const top = -element.height / 2 - 28 * k
    return (
        <g transform={`translate(${element.x} ${element.y}) rotate(${element.rotation})`}>
            <line x1={0} y1={-element.height / 2} x2={0} y2={top} stroke="#2563eb" strokeWidth={1.5 * k} />
            <circle
                cx={0}
                cy={top}
                r={7 * k}
                fill="#ffffff"
                stroke="#2563eb"
                strokeWidth={2 * k}
                className="cursor-alias"
                onPointerDown={e => onHandleDown(e, 'rotate', element.key)}
            >
                <title>Girar (Mayús para giro libre)</title>
            </circle>
            <rect
                x={element.width / 2 - 6 * k}
                y={element.height / 2 - 6 * k}
                width={12 * k}
                height={12 * k}
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth={1.5 * k}
                className="cursor-nwse-resize"
                onPointerDown={e => onHandleDown(e, 'resize', element.key)}
            >
                <title>Cambiar tamaño</title>
            </rect>
        </g>
    )
}

function toPlan(svg: SVGSVGElement, clientX: number, clientY: number): RoomPoint {
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const point = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
    return { x: point.x, y: point.y }
}
