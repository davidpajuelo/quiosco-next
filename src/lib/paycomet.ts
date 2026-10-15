import { createHash, randomBytes, timingSafeEqual } from "crypto"

// API REST de PAYCOMET: https://docs.paycomet.com/es/integracion/rest-docs
const PAYCOMET_API_URL = 'https://rest.paycomet.com'

// Tipos de operación de PAYCOMET (TransactionType en las notificaciones)
export const PAYCOMET_AUTHORIZATION = '1'
export const PAYCOMET_REFUND = '2'

function getEnv(name: string) {
    const value = process.env[name]
    if (!value) {
        throw new Error(`Falta la variable de entorno ${name}`)
    }
    return value
}

export type CheckoutItem = {
    name: string
    price: number
    quantity: number
}

// PAYCOMET trabaja con céntimos enteros (29.90 -> 2990), el resto de la aplicación con euros
export function toCents(amount: number) {
    return Math.round(amount * 100)
}

// Referencia única del pedido en PAYCOMET (máximo 20 caracteres alfanuméricos)
export function createPaycometOrderReference() {
    return `Q${randomBytes(8).toString('hex').toUpperCase()}`
}

type FormResponse = {
    errorCode: number
    challengeUrl?: string
}

// Crea el formulario de pago alojado de PAYCOMET (equivalente al Checkout de Stripe).
// Sin "methods" se muestran todos los métodos activos en el terminal (tarjeta, Bizum...)
export async function createPaymentForm(items: CheckoutItem[], reference: string, origin: string) {
    const terminal = Number(getEnv('PAYCOMET_TERMINAL'))
    const amount = items.reduce((total, item) => total + toCents(item.price) * item.quantity, 0)

    const response = await fetch(`${PAYCOMET_API_URL}/v1/form`, {
        method: 'POST',
        headers: {
            'PAYCOMET-API-TOKEN': getEnv('PAYCOMET_API_KEY'),
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            operationType: Number(PAYCOMET_AUTHORIZATION),
            language: 'es',
            terminal,
            payment: {
                terminal,
                order: reference,
                amount: String(amount),
                currency: 'EUR',
                secure: 1,
                userInteraction: 1,
                productDescription: items.map(item => `${item.quantity}x ${item.name}`).join(', ').slice(0, 255),
                urlOk: `${origin}/checkout/success?order=${reference}`,
                urlKo: `${origin}/checkout/cancel`
            }
        }),
        cache: 'no-store'
    })

    const data: FormResponse = await response.json()
    if (!response.ok || data.errorCode !== 0 || !data.challengeUrl) {
        throw new Error(`PAYCOMET /v1/form error ${data.errorCode} (HTTP ${response.status})`)
    }
    return { url: data.challengeUrl }
}

// Comprueba el NotificationHash que PAYCOMET envía en cada notificación:
// SHA512(AccountCode + TpvID + TransactionType + Order + Amount + Currency + md5(password) + BankDateTime + Response)
// Se usan el código de cliente y el terminal propios, no los recibidos, para rechazar notificaciones de otras cuentas.
export function verifyNotificationHash(params: URLSearchParams) {
    const received = params.get('NotificationHash')
    if (!received) return false

    const passwordHash = createHash('md5').update(getEnv('PAYCOMET_PASSWORD')).digest('hex')
    const expected = createHash('sha512').update(
        getEnv('PAYCOMET_ACCOUNT_CODE') +
        getEnv('PAYCOMET_TERMINAL') +
        (params.get('TransactionType') ?? '') +
        (params.get('Order') ?? '') +
        (params.get('Amount') ?? '') +
        (params.get('Currency') ?? '') +
        passwordHash +
        (params.get('BankDateTime') ?? '') +
        (params.get('Response') ?? '')
    ).digest('hex')

    const a = Buffer.from(expected)
    const b = Buffer.from(received.toLowerCase())
    return a.length === b.length && timingSafeEqual(a, b)
}
