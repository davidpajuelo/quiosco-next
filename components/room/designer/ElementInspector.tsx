'use client'
import { useState } from 'react'
import { DocumentDuplicateIcon, TrashIcon } from '@heroicons/react/24/outline'
import { type BarSide, type DesignerElement, KIND_NAMES, MIN_SIZE, isTableKind, normalizeAngle } from './layout'

type ElementInspectorProps = {
    element: DesignerElement
    error?: string
    onBeginChange: () => void
    onChange: (patch: Partial<DesignerElement>) => void
    onDuplicate: () => void
    onDelete: () => void
    onAddStools: (count: number, side: BarSide) => void
}

const inputClass = 'border border-gray-200 p-2 w-full bg-white'

export default function ElementInspector({
    element, error, onBeginChange, onChange, onDuplicate, onDelete, onAddStools
}: ElementInspectorProps) {
    const [stoolCount, setStoolCount] = useState(6)
    const [stoolSide, setStoolSide] = useState<BarSide>('front')
    const isTable = isTableKind(element.kind)
    const fieldId = (name: string) => `element-${name}`

    const numberField = (name: 'width' | 'height' | 'rotation', label: string) => (
        <NumberField
            id={fieldId(name)}
            label={label}
            value={element[name]}
            min={name === 'rotation' ? -360 : MIN_SIZE}
            max={name === 'rotation' ? 360 : 10000}
            step={name === 'rotation' ? 15 : 10}
            onFocus={onBeginChange}
            onCommit={value => {
                if (name === 'rotation') onChange({ rotation: normalizeAngle(value) })
                // Los círculos son siempre redondos: ancho y fondo van juntos
                else onChange(element.shape === 'circle' ? { width: value, height: value } : { [name]: value })
            }}
        />
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-bold">{KIND_NAMES[element.kind]}</h2>
                <div className="flex gap-1">
                    <button
                        type="button"
                        onClick={onDuplicate}
                        title="Duplicar (Ctrl+D)"
                        aria-label="Duplicar elemento"
                        className="p-1 rounded hover:bg-gray-100 cursor-pointer"
                    >
                        <DocumentDuplicateIcon className="size-6" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        title="Eliminar (Supr)"
                        aria-label="Eliminar elemento"
                        className="p-1 rounded text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                        <TrashIcon className="size-6" aria-hidden="true" />
                    </button>
                </div>
            </div>

            {isTable ? (
                <div className="space-y-1">
                    <label htmlFor={fieldId('code')} className="block text-sm font-bold">Código de mesa</label>
                    <input
                        id={fieldId('code')}
                        type="text"
                        value={element.code ?? ''}
                        maxLength={20}
                        onFocus={onBeginChange}
                        onChange={e => onChange({ code: e.target.value })}
                        aria-invalid={!!error}
                        aria-describedby={fieldId('code-help')}
                        className={`${inputClass} ${error ? 'border-red-500' : ''}`}
                    />
                    <p id={fieldId('code-help')} className={`text-sm ${error ? 'text-red-600' : 'text-gray-600'}`}>
                        {error ?? <>Se da de alta como mesa al guardar. QR: <code>/mesa/{element.code?.trim()}</code></>}
                    </p>
                </div>
            ) : (
                <div className="space-y-1">
                    <label htmlFor={fieldId('label')} className="block text-sm font-bold">Etiqueta</label>
                    <input
                        id={fieldId('label')}
                        type="text"
                        value={element.label ?? ''}
                        maxLength={40}
                        placeholder={element.kind === 'bar' ? 'Barra' : 'Columna, escalera, baño…'}
                        onFocus={onBeginChange}
                        onChange={e => onChange({ label: e.target.value })}
                        className={inputClass}
                    />
                </div>
            )}

            {element.kind !== 'bar' && (
                <fieldset className="space-y-1">
                    <legend className="block text-sm font-bold">Forma</legend>
                    <div className="flex gap-2">
                        {(['rect', 'circle'] as const).map(shape => (
                            <button
                                key={shape}
                                type="button"
                                aria-pressed={element.shape === shape}
                                onClick={() => {
                                    if (element.shape === shape) return
                                    onBeginChange()
                                    const side = Math.max(element.width, element.height)
                                    onChange(shape === 'circle' ? { shape, width: side, height: side } : { shape })
                                }}
                                className={`flex-1 py-2 rounded border cursor-pointer ${element.shape === shape ? 'bg-primary border-transparent font-bold' : 'border-gray-300 bg-white hover:bg-gray-50'}`}
                            >
                                {shape === 'rect' ? 'Rectangular' : 'Redonda'}
                            </button>
                        ))}
                    </div>
                </fieldset>
            )}

            <div className="grid grid-cols-2 gap-3">
                {numberField('width', element.shape === 'circle' ? 'Diámetro (cm)' : 'Ancho (cm)')}
                {element.shape !== 'circle' && numberField('height', 'Fondo (cm)')}
                {numberField('rotation', 'Giro (°)')}
            </div>

            {element.kind === 'bar' && (
                <div className="space-y-3 border-t border-gray-200 pt-4">
                    <h3 className="font-bold">Taburetes de la barra</h3>
                    <p className="text-sm text-gray-600">
                        Se reparten a lo largo de la barra y cada uno se da de alta como mesa.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <NumberField
                            id={fieldId('stools')}
                            label="Cantidad"
                            value={stoolCount}
                            min={1}
                            max={50}
                            step={1}
                            onCommit={setStoolCount}
                        />
                        <div className="space-y-1">
                            <label htmlFor={fieldId('side')} className="block text-sm font-bold">Lado</label>
                            <select
                                id={fieldId('side')}
                                value={stoolSide}
                                onChange={e => setStoolSide(e.target.value as BarSide)}
                                className={inputClass}
                            >
                                <option value="front">Delante</option>
                                <option value="back">Detrás</option>
                            </select>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onAddStools(stoolCount, stoolSide)}
                        className="py-2 rounded font-bold text-black bg-primary hover:bg-primary-dark w-full cursor-pointer"
                    >
                        Añadir taburetes
                    </button>
                </div>
            )}
        </div>
    )
}

type NumberFieldProps = {
    id: string
    label: string
    value: number
    min: number
    max: number
    step: number
    onFocus?: () => void
    onCommit: (value: number) => void
}

// Mientras se escribe se guarda el texto tal cual y solo se aplican los valores válidos;
// al salir del campo vuelve a mostrar el último valor aplicado
function NumberField({ id, label, value, min, max, step, onFocus, onCommit }: NumberFieldProps) {
    const [draft, setDraft] = useState<string | null>(null)
    return (
        <div className="space-y-1">
            <label htmlFor={id} className="block text-sm font-bold">{label}</label>
            <input
                id={id}
                type="number"
                inputMode="numeric"
                min={min}
                max={max}
                step={step}
                value={draft ?? String(Math.round(value))}
                onFocus={() => {
                    setDraft(String(Math.round(value)))
                    onFocus?.()
                }}
                onChange={e => {
                    setDraft(e.target.value)
                    const number = e.target.valueAsNumber
                    if (!Number.isNaN(number) && number >= min && number <= max) onCommit(number)
                }}
                onBlur={() => setDraft(null)}
                className={inputClass}
            />
        </div>
    )
}
