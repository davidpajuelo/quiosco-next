import type { RoomLayoutElement } from '@/src/schema'
import type { RoomElementKind, RoomPoint } from '@/src/types'
import { ADMIN_TABLE_ID } from '@/src/lib/table-session'

// Todo el plano va en centímetros. key solo existe en el editor para identificar cada elemento
export type DesignerElement = RoomLayoutElement & { key: string }

export type RoomDoc = {
    name: string
    outline: RoomPoint[]
    elements: DesignerElement[]
}

// Zona visible del plano (viewBox del SVG)
export type View = { x: number, y: number, w: number, h: number }

// Lo que se guarda de cada elemento: todo menos la key del editor
export const toLayoutElement = ({ kind, shape, x, y, width, height, rotation, label, code }: DesignerElement): RoomLayoutElement =>
    ({ kind, shape, x, y, width, height, rotation, label, code })

export const GRID_STEP = 10
export const MIN_SIZE = 10

let keySeq = 0
export const newKey = () => `n${Date.now().toString(36)}${keySeq++}`

export type ElementPreset = 'table-square' | 'table-round' | 'table-long' | 'bar' | 'stool' | 'obstacle'

export const ELEMENT_PRESETS: Record<ElementPreset, { text: string } & Pick<DesignerElement, 'kind' | 'shape' | 'width' | 'height' | 'label'>> = {
    'table-square': { text: 'Mesa cuadrada', kind: 'table', shape: 'rect', width: 80, height: 80, label: null },
    'table-round': { text: 'Mesa redonda', kind: 'table', shape: 'circle', width: 90, height: 90, label: null },
    'table-long': { text: 'Mesa alargada', kind: 'table', shape: 'rect', width: 160, height: 80, label: null },
    'bar': { text: 'Barra', kind: 'bar', shape: 'rect', width: 400, height: 60, label: 'Barra' },
    'stool': { text: 'Taburete', kind: 'stool', shape: 'circle', width: 40, height: 40, label: null },
    'obstacle': { text: 'Obstáculo', kind: 'obstacle', shape: 'rect', width: 60, height: 60, label: 'Columna' }
}

export const KIND_NAMES: Record<RoomElementKind, string> = {
    table: 'Mesa',
    stool: 'Taburete',
    bar: 'Barra',
    obstacle: 'Obstáculo'
}

export const isTableKind = (kind: RoomElementKind) => kind === 'table' || kind === 'stool'

// Las mesas se numeran 1, 2, 3… y los taburetes de la barra B1, B2…
const CODE_PREFIX: Partial<Record<RoomElementKind, string>> = { table: '', stool: 'B' }

export function nextCode(kind: RoomElementKind, used: Set<string>) {
    const prefix = CODE_PREFIX[kind] ?? ''
    for (let n = 1; ; n++) {
        const code = `${prefix}${n}`
        if (!used.has(code) && code !== ADMIN_TABLE_ID) return code
    }
}

export function usedCodes(elements: DesignerElement[], takenCodes: Record<string, string>) {
    const used = new Set(Object.keys(takenCodes))
    for (const element of elements) {
        const code = element.code?.trim()
        if (code) used.add(code)
    }
    return used
}

export const snap = (value: number, enabled: boolean) => enabled ? Math.round(value / GRID_STEP) * GRID_STEP : Math.round(value)

export function rotate(point: RoomPoint, degrees: number): RoomPoint {
    const rad = degrees * Math.PI / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    return { x: point.x * cos - point.y * sin, y: point.x * sin + point.y * cos }
}

// Ángulo en (-180, 180]
export function normalizeAngle(degrees: number) {
    const a = ((degrees % 360) + 360) % 360
    return a > 180 ? a - 360 : a
}

export function bounds(points: RoomPoint[]) {
    const xs = points.map(p => p.x)
    const ys = points.map(p => p.y)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    return { minX, minY, maxX: Math.max(...xs), maxY: Math.max(...ys) }
}

export function fitView(outline: RoomPoint[], elements: RoomPoint[]): View {
    const points = [...outline, ...elements.map(e => ({ x: e.x, y: e.y }))]
    const b = bounds(points)
    const margin = Math.max(100, (b.maxX - b.minX + b.maxY - b.minY) * 0.08)
    return { x: b.minX - margin, y: b.minY - margin, w: b.maxX - b.minX + margin * 2, h: b.maxY - b.minY + margin * 2 }
}

// Ray casting
export function isInside(point: RoomPoint, polygon: RoomPoint[]) {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const a = polygon[i]
        const b = polygon[j]
        if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) {
            inside = !inside
        }
    }
    return inside
}

// Área en m² (fórmula del lazo, el plano va en cm)
export function area(polygon: RoomPoint[]) {
    let sum = 0
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        sum += (polygon[j].x + polygon[i].x) * (polygon[j].y - polygon[i].y)
    }
    return Math.abs(sum / 2) / 10000
}

export type OutlinePreset = 'rect' | 'l-shape' | 'u-shape'

// Contornos predefinidos sobre las medidas actuales de la sala
export function outlinePreset(preset: OutlinePreset, current: RoomPoint[]): RoomPoint[] {
    const { minX: x0, minY: y0, maxX: x1, maxY: y1 } = bounds(current)
    const w = x1 - x0
    const h = y1 - y0
    const sx = (f: number) => snap(x0 + w * f, true)
    const sy = (f: number) => snap(y0 + h * f, true)
    switch (preset) {
        case 'rect':
            return [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }]
        case 'l-shape':
            return [
                { x: x0, y: y0 }, { x: sx(0.55), y: y0 }, { x: sx(0.55), y: sy(0.5) },
                { x: x1, y: sy(0.5) }, { x: x1, y: y1 }, { x: x0, y: y1 }
            ]
        case 'u-shape':
            return [
                { x: x0, y: y0 }, { x: sx(0.35), y: y0 }, { x: sx(0.35), y: sy(0.5) },
                { x: sx(0.65), y: sy(0.5) }, { x: sx(0.65), y: y0 }, { x: x1, y: y0 },
                { x: x1, y: y1 }, { x: x0, y: y1 }
            ]
    }
}

export type BarSide = 'front' | 'back'

// Taburetes repartidos a lo largo de una barra, a 15 cm de su borde
export function stoolsAlongBar(bar: DesignerElement, count: number, side: BarSide, used: Set<string>): DesignerElement[] {
    const { width, height } = ELEMENT_PRESETS.stool
    const offset = (bar.height / 2 + 15 + height / 2) * (side === 'front' ? 1 : -1)
    const spacing = bar.width / count
    const codes = new Set(used)
    return Array.from({ length: count }, (_, i) => {
        const local = { x: -bar.width / 2 + spacing * (i + 0.5), y: offset }
        const p = rotate(local, bar.rotation)
        const code = nextCode('stool', codes)
        codes.add(code)
        return {
            key: newKey(),
            kind: 'stool',
            shape: 'circle',
            x: Math.round(bar.x + p.x),
            y: Math.round(bar.y + p.y),
            width,
            height,
            rotation: bar.rotation,
            label: null,
            code
        }
    })
}
