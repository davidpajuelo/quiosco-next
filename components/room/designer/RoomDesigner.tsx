'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    ArrowUturnLeftIcon, ArrowUturnRightIcon, ArrowsPointingInIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import { saveRoomLayout } from '@/actions/room-actions'
import { RoomLayoutSchema, RoomNameSchema, TableCodeSchema, type RoomLayout } from '@/src/schema'
import type { RoomPoint } from '@/src/types'
import ElementInspector from './ElementInspector'
import RoomCanvas from './RoomCanvas'
import {
    type BarSide, type DesignerElement, type ElementPreset, type OutlinePreset, type RoomDoc, type View,
    ELEMENT_PRESETS, GRID_STEP, area, fitView, isInside, isTableKind, newKey, nextCode, outlinePreset, snap,
    stoolsAlongBar, toLayoutElement, usedCodes
} from './layout'

type RoomDesignerProps = {
    roomId: number
    initial: RoomDoc
    // Códigos de mesa que ya están en otras salas, con el nombre de la sala
    takenCodes: Record<string, string>
}

const OUTLINE_PRESETS: { preset: OutlinePreset, text: string }[] = [
    { preset: 'rect', text: 'Rectangular' },
    { preset: 'l-shape', text: 'En L' },
    { preset: 'u-shape', text: 'En U' }
]

const toolButton = 'inline-flex items-center gap-1 py-2 px-3 rounded border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'

export default function RoomDesigner({ roomId, initial, takenCodes }: RoomDesignerProps) {
    const [doc, setDoc] = useState(initial)
    const [saved, setSaved] = useState(initial)
    const [past, setPast] = useState<RoomDoc[]>([])
    const [future, setFuture] = useState<RoomDoc[]>([])
    const [selectedKey, setSelectedKey] = useState<string | null>(null)
    const [snapEnabled, setSnapEnabled] = useState(true)
    const [view, setView] = useState<View>(() => fitView(initial.outline, initial.elements))
    const [pending, setPending] = useState(false)

    const docRef = useRef(doc)
    docRef.current = doc

    // Guarda el estado actual antes de un cambio. Si no ha cambiado nada desde el último, no se repite
    const beginChange = useCallback(() => {
        const current = docRef.current
        setPast(p => p.at(-1) === current ? p : [...p.slice(-99), current])
        setFuture([])
    }, [])

    const undo = () => {
        const previous = past.at(-1)
        if (!previous) return
        setPast(past.slice(0, -1))
        setFuture([doc, ...future])
        setDoc(previous)
    }

    const redo = () => {
        const next = future[0]
        if (!next) return
        setFuture(future.slice(1))
        setPast([...past, doc])
        setDoc(next)
    }

    const updateElement = useCallback((key: string, patch: Partial<DesignerElement>) => {
        setDoc(d => ({ ...d, elements: d.elements.map(el => el.key === key ? { ...el, ...patch } : el) }))
    }, [])

    const setOutline = useCallback((outline: RoomPoint[]) => {
        setDoc(d => ({ ...d, outline }))
    }, [])

    const addElements = (elements: DesignerElement[]) => {
        beginChange()
        setDoc(d => ({ ...d, elements: [...d.elements, ...elements] }))
        setSelectedKey(elements.at(-1)?.key ?? null)
    }

    const addPreset = (preset: ElementPreset) => {
        const { kind, shape, width, height, label } = ELEMENT_PRESETS[preset]
        addElements([{
            kind, shape, width, height, label,
            key: newKey(),
            x: snap(view.x + view.w / 2, true),
            y: snap(view.y + view.h / 2, true),
            rotation: 0,
            code: isTableKind(kind) ? nextCode(kind, usedCodes(doc.elements, takenCodes)) : null
        }])
    }

    const selected = doc.elements.find(el => el.key === selectedKey)

    const duplicateSelected = () => {
        if (!selected) return
        addElements([{
            ...selected,
            key: newKey(),
            x: selected.x + 4 * GRID_STEP,
            y: selected.y + 4 * GRID_STEP,
            code: isTableKind(selected.kind) ? nextCode(selected.kind, usedCodes(doc.elements, takenCodes)) : null
        }])
    }

    const deleteSelected = () => {
        if (!selected) return
        beginChange()
        setDoc(d => ({ ...d, elements: d.elements.filter(el => el.key !== selected.key) }))
        setSelectedKey(null)
    }

    const addStools = (count: number, side: BarSide) => {
        if (selected?.kind !== 'bar') return
        addElements(stoolsAlongBar(selected, count, side, usedCodes(doc.elements, takenCodes)))
        // Se queda seleccionada la barra para poder seguir ajustándola
        setSelectedKey(selected.key)
    }

    const applyOutlinePreset = (preset: OutlinePreset) => {
        beginChange()
        setOutline(outlinePreset(preset, doc.outline))
    }

    const zoom = (factor: number) => {
        setView(v => ({ x: v.x + v.w * (1 - factor) / 2, y: v.y + v.h * (1 - factor) / 2, w: v.w * factor, h: v.h * factor }))
    }

    // Errores de código por elemento: vacío o no válido, repetido en la sala o usado en otra
    const codeErrors = useMemo(() => {
        const counts = new Map<string, number>()
        for (const el of doc.elements) {
            const code = el.code?.trim()
            if (code) counts.set(code, (counts.get(code) ?? 0) + 1)
        }
        const errors = new Map<string, string>()
        for (const el of doc.elements) {
            if (!isTableKind(el.kind)) continue
            const result = TableCodeSchema.safeParse(el.code ?? '')
            if (!result.success) {
                errors.set(el.key, result.error.issues[0].message)
            } else if ((counts.get(result.data) ?? 0) > 1) {
                errors.set(el.key, `El código ${result.data} está repetido en esta sala`)
            } else if (takenCodes[result.data]) {
                errors.set(el.key, `El código ${result.data} ya está en la sala ${takenCodes[result.data]}`)
            }
        }
        return errors
    }, [doc.elements, takenCodes])

    const invalidKeys = useMemo(() => new Set(codeErrors.keys()), [codeErrors])
    const outsideCount = doc.elements.filter(el => !isInside(el, doc.outline)).length
    const tableCount = doc.elements.filter(el => el.kind === 'table').length
    const stoolCount = doc.elements.filter(el => el.kind === 'stool').length
    const dirty = useMemo(() => JSON.stringify(doc) !== JSON.stringify(saved), [doc, saved])

    const handleSave = async () => {
        const snapshot = doc
        const name = RoomNameSchema.safeParse(snapshot.name)
        if (!name.success) {
            name.error.issues.forEach(issue => toast.error(issue.message))
            return
        }
        if (codeErrors.size) {
            toast.error(codeErrors.size === 1 ? 'Hay 1 mesa con un código no válido' : `Hay ${codeErrors.size} mesas con códigos no válidos`)
            setSelectedKey(codeErrors.keys().next().value ?? null)
            return
        }
        const layout: RoomLayout = {
            name: snapshot.name,
            outline: snapshot.outline,
            elements: snapshot.elements.map(toLayoutElement)
        }
        const result = RoomLayoutSchema.safeParse(layout)
        if (!result.success) {
            result.error.issues.forEach(issue => toast.error(issue.message))
            return
        }

        setPending(true)
        const response = await saveRoomLayout(roomId, layout)
        setPending(false)
        if ('errors' in response) {
            response.errors.forEach(issue => toast.error(issue.message))
            return
        }
        setSaved(snapshot)
        toast.success('Sala guardada')
    }

    useEffect(() => {
        if (!dirty) return
        const handleBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [dirty])

    // El listener se registra una vez y siempre llama a la última versión del manejador
    const handleKeyDown = useRef<(e: KeyboardEvent) => void>()
    handleKeyDown.current = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement
        if (target.closest('input, textarea, select, [contenteditable="true"]')) return
        const mod = e.ctrlKey || e.metaKey
        const key = e.key.toLowerCase()

        if (mod && key === 'z') {
            e.preventDefault()
            if (e.shiftKey) redo()
            else undo()
        } else if (mod && key === 'y') {
            e.preventDefault()
            redo()
        } else if (mod && key === 's') {
            e.preventDefault()
            if (!pending) handleSave()
        } else if (mod && key === 'd') {
            e.preventDefault()
            duplicateSelected()
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            if (!selected) return
            e.preventDefault()
            deleteSelected()
        } else if (e.key === 'Escape') {
            setSelectedKey(null)
        } else if (selected && e.key.startsWith('Arrow')) {
            e.preventDefault()
            const step = e.shiftKey ? 1 : GRID_STEP
            const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
            const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
            beginChange()
            updateElement(selected.key, { x: selected.x + dx, y: selected.y + dy })
        }
    }

    useEffect(() => {
        const listener = (e: KeyboardEvent) => handleKeyDown.current?.(e)
        window.addEventListener('keydown', listener)
        return () => window.removeEventListener('keydown', listener)
    }, [])

    return (
        <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-end gap-3">
                <div className="flex-1 space-y-1">
                    <label htmlFor="room-name" className="block text-sm font-bold">Nombre de la sala</label>
                    <input
                        id="room-name"
                        type="text"
                        value={doc.name}
                        maxLength={60}
                        onFocus={beginChange}
                        onChange={e => setDoc(d => ({ ...d, name: e.target.value }))}
                        className="border border-gray-200 p-2 w-full bg-white text-xl"
                    />
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={pending}
                    className="py-3 px-10 rounded font-bold uppercase text-black bg-primary hover:bg-primary-dark cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {pending ? 'Guardando…' : dirty ? 'Guardar sala' : 'Guardado'}
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Añadir elementos">
                {(Object.keys(ELEMENT_PRESETS) as ElementPreset[]).map(preset => (
                    <button key={preset} type="button" onClick={() => addPreset(preset)} className={toolButton}>
                        + {ELEMENT_PRESETS[preset].text}
                    </button>
                ))}
                <span className="mx-1 h-6 border-l border-gray-300" aria-hidden="true" />
                <button type="button" onClick={undo} disabled={!past.length} title="Deshacer (Ctrl+Z)" className={toolButton}>
                    <ArrowUturnLeftIcon className="size-5" aria-hidden="true" /> Deshacer
                </button>
                <button type="button" onClick={redo} disabled={!future.length} title="Rehacer (Ctrl+Y)" className={toolButton}>
                    <ArrowUturnRightIcon className="size-5" aria-hidden="true" /> Rehacer
                </button>
                <label className="inline-flex items-center gap-2 ml-1 cursor-pointer">
                    <input type="checkbox" checked={snapEnabled} onChange={e => setSnapEnabled(e.target.checked)} className="size-4" />
                    Ajustar a la rejilla (10 cm)
                </label>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1 h-[65vh] min-h-[420px] border border-gray-300 rounded overflow-hidden">
                    <RoomCanvas
                        outline={doc.outline}
                        elements={doc.elements}
                        selectedKey={selectedKey}
                        invalidKeys={invalidKeys}
                        snapEnabled={snapEnabled}
                        view={view}
                        setView={setView}
                        onSelect={setSelectedKey}
                        onBeginChange={beginChange}
                        onElementChange={updateElement}
                        onOutlineChange={setOutline}
                    />
                    <div className="absolute bottom-3 right-3 flex flex-col gap-1">
                        <button type="button" onClick={() => zoom(1 / 1.25)} aria-label="Acercar" title="Acercar" className={toolButton}>
                            <MagnifyingGlassPlusIcon className="size-5" aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => zoom(1.25)} aria-label="Alejar" title="Alejar" className={toolButton}>
                            <MagnifyingGlassMinusIcon className="size-5" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setView(fitView(doc.outline, doc.elements))}
                            aria-label="Encuadrar la sala"
                            title="Encuadrar la sala"
                            className={toolButton}
                        >
                            <ArrowsPointingInIcon className="size-5" aria-hidden="true" />
                        </button>
                    </div>
                </div>

                <aside className="lg:w-80 bg-white p-4 shadow self-start w-full" aria-label="Propiedades">
                    {selected ? (
                        <ElementInspector
                            key={selected.key}
                            element={selected}
                            error={codeErrors.get(selected.key)}
                            onBeginChange={beginChange}
                            onChange={patch => updateElement(selected.key, patch)}
                            onDuplicate={duplicateSelected}
                            onDelete={deleteSelected}
                            onAddStools={addStools}
                        />
                    ) : (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">Sala</h2>
                            <dl className="grid grid-cols-2 gap-y-1 text-sm">
                                <dt className="text-gray-600">Superficie</dt>
                                <dd className="font-bold">{area(doc.outline).toFixed(1)} m²</dd>
                                <dt className="text-gray-600">Mesas</dt>
                                <dd className="font-bold">{tableCount}</dd>
                                <dt className="text-gray-600">Taburetes</dt>
                                <dd className="font-bold">{stoolCount}</dd>
                            </dl>
                            {outsideCount > 0 && (
                                <p className="text-sm text-amber-700">
                                    {outsideCount === 1 ? 'Hay 1 elemento' : `Hay ${outsideCount} elementos`} fuera de la sala (borde naranja).
                                </p>
                            )}
                            {codeErrors.size > 0 && (
                                <p className="text-sm text-red-600">
                                    {codeErrors.size === 1 ? 'Hay 1 mesa' : `Hay ${codeErrors.size} mesas`} con el código mal (borde rojo).
                                </p>
                            )}

                            <fieldset className="space-y-2">
                                <legend className="font-bold">Forma de la sala</legend>
                                <div className="flex gap-2">
                                    {OUTLINE_PRESETS.map(({ preset, text }) => (
                                        <button key={preset} type="button" onClick={() => applyOutlinePreset(preset)} className={`${toolButton} flex-1 justify-center`}>
                                            {text}
                                        </button>
                                    ))}
                                </div>
                            </fieldset>

                            <div className="text-sm text-gray-600 space-y-1 border-t border-gray-200 pt-4">
                                <p>Arrastra los vértices para cambiar el contorno; el + de cada lado añade un vértice y el doble clic lo quita.</p>
                                <p>Arrastra el fondo para moverte y usa la rueda para el zoom.</p>
                                <p>Pulsa un elemento para editarlo. Flechas para moverlo, Supr para borrarlo y Ctrl+D para duplicarlo.</p>
                                <p>Las mesas y taburetes se dan de alta como mesas al guardar, con su código.</p>
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    )
}
