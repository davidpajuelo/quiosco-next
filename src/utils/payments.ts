// Cuentas de lo que queda por pagar de un pedido, compartidas por el servidor y las pantallas
// de cobro para que lo que se ve sea lo que se comprueba. Todo en céntimos, para no acumular
// errores de redondeo con decimales

type PayableLine = {
    id: number
    quantity: number
    price: number | null
    paid: boolean
    product?: { price: number } | null
}

type PayableOrder = {
    total: number
    orderProducts: PayableLine[]
}

// Dividir Pago: id de la línea → cantidad que se paga de ella (de 1 a su cantidad)
export type LineSelection = Map<number, number>

// Línea sin pagar y la cantidad que se paga de ella
export type LineToPay<T> = { line: T, quantity: number }

export const toCents = (amount: number) => Math.round(amount * 100)
export const fromCents = (cents: number) => cents / 100

// Precio guardado en la línea; las líneas antiguas de productos de la carta usan el del producto
export const linePrice = (line: PayableLine) => line.price ?? line.product?.price ?? 0

export const lineCents = (line: PayableLine, quantity = line.quantity) => toCents(linePrice(line) * quantity)

// Pendiente de pago del pedido: su total menos sus Productos Pagados
export function remainingCents(order: PayableOrder) {
    const paid = order.orderProducts.filter(line => line.paid).reduce((sum, line) => sum + lineCents(line), 0)
    return Math.max(0, toCents(order.total) - paid)
}

// Líneas del pedido que se cobran y cuánto de cada una: lo elegido de las que siguen sin pagar,
// o todo lo que queda si no se elige
export function linesToPay<T extends PayableLine>(lines: T[], selection: LineSelection | null): LineToPay<T>[] {
    return lines.flatMap(line => {
        if (line.paid) return []
        const quantity = selection ? Math.min(selection.get(line.id) ?? 0, line.quantity) : line.quantity
        return quantity > 0 ? [{ line, quantity }] : []
    })
}

// Con lo elegido, el pedido queda pagado entero
export function completesOrder(order: PayableOrder, selection: LineSelection | null) {
    const unpaid = order.orderProducts.filter(line => !line.paid)
    const paying = linesToPay(order.orderProducts, selection)
    return paying.length === unpaid.length && paying.every(({ line, quantity }) => quantity === line.quantity)
}

// Lo que se cobra del pedido. Si con lo elegido queda pagado entero se cobra todo lo pendiente,
// para que lo pagado cuadre siempre con el total del pedido
export function chargeCents(order: PayableOrder, selection: LineSelection | null) {
    if (completesOrder(order, selection)) return remainingCents(order)
    return linesToPay(order.orderProducts, selection).reduce((sum, { line, quantity }) => sum + lineCents(line, quantity), 0)
}

// Selección en la URL (?lineas=12:2,15): id de la línea y cantidad; sin cantidad, la línea entera
export function parseSelection(value: string | undefined): { id: number, quantity: number | null }[] {
    return (value ?? '').split(',').flatMap(part => {
        const [id, quantity] = part.split(':').map(Number)
        if (!Number.isInteger(id) || id <= 0) return []
        return [{ id, quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : null }]
    })
}

export function formatSelection(selection: { id: number, quantity: number }[]) {
    return selection.map(({ id, quantity }) => `${id}:${quantity}`).join(',')
}
