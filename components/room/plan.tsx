import type { RoomLayoutElement } from '@/src/schema'
import type { RoomPoint } from '@/src/types'

// Dibujo del plano compartido por el diseñador y la vista de salas. Medidas en centímetros;
// k son los centímetros por píxel de pantalla, para que trazos y textos midan siempre lo mismo

// Las barras y obstáculos debajo, los taburetes encima
const LAYER = { obstacle: 0, bar: 1, table: 2, stool: 3 }

export const PLAN_FILL = { table: '#d6a86c', stool: '#8a5a2b', bar: '#5b3a1e', obstacle: 'url(#hatch)' }

export const sortByLayer = <T extends RoomLayoutElement>(elements: T[]) =>
    [...elements].sort((a, b) => LAYER[a.kind] - LAYER[b.kind])

export function PlanDefs({ k }: { k: number }) {
    return (
        <defs>
            <pattern id="grid-small" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth={k} />
            </pattern>
            <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#grid-small)" />
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#d1d5db" strokeWidth={k * 1.5} />
            </pattern>
            <pattern id="hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="12" height="12" fill="#9ca3af" />
                <line x1="0" y1="0" x2="0" y2="12" stroke="#4b5563" strokeWidth="5" />
            </pattern>
        </defs>
    )
}

export function PlanOutline({ outline }: { outline: RoomPoint[] }) {
    return (
        <polygon
            points={outline.map(p => `${p.x},${p.y}`).join(' ')}
            fill="#fdf5e6"
            fillOpacity={0.85}
            stroke="#374151"
            strokeWidth={10}
            strokeLinejoin="round"
        />
    )
}

type PlanShapeProps = {
    element: RoomLayoutElement
    fill?: string
    stroke: string
    strokeWidth: number
    strokeDasharray?: string
}

export function PlanShape({ element, fill = PLAN_FILL[element.kind], ...stroke }: PlanShapeProps) {
    return (
        <g transform={`translate(${element.x} ${element.y}) rotate(${element.rotation})`}>
            {element.shape === 'circle'
                ? <ellipse rx={element.width / 2} ry={element.height / 2} fill={fill} {...stroke} />
                : <rect
                    x={-element.width / 2}
                    y={-element.height / 2}
                    width={element.width}
                    height={element.height}
                    rx={element.kind === 'table' ? 6 : 2}
                    fill={fill}
                    {...stroke}
                />}
        </g>
    )
}

type PlanLabelProps = {
    element: RoomLayoutElement
    text: string
    k: number
    fill?: string
}

export function PlanLabel({ element, text, k, fill = element.kind === 'table' ? '#1f2937' : '#ffffff' }: PlanLabelProps) {
    return (
        <text
            x={element.x}
            y={element.y}
            fontSize={Math.min(13 * k, Math.min(element.width, element.height) * 0.45)}
            textAnchor="middle"
            dominantBaseline="central"
            fontWeight="bold"
            fill={fill}
            pointerEvents="none"
        >
            {text}
        </text>
    )
}
