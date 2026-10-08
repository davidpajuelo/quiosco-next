// Identificación de mesa firmada (HMAC). Usa Web Crypto para funcionar en middleware (Edge) y en Node.
export const TABLE_COOKIE = 'mesa'

function getSecret() {
    const secret = process.env.TABLE_SECRET
    if (!secret) {
        throw new Error('Falta la variable de entorno TABLE_SECRET')
    }
    return secret
}

function toHex(buffer: ArrayBuffer) {
    return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function signTable(tableId: string) {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(getSecret()),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )
    return toHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(tableId)))
}

// Comparación en tiempo constante
function safeEqual(a: string, b: string) {
    if (a.length !== b.length) return false
    let diff = 0
    for (let i = 0; i < a.length; i++) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return diff === 0
}

export async function verifyTable(tableId: string, signature: string) {
    return safeEqual(await signTable(tableId), signature)
}

// Valor de la cookie: "<mesa>.<firma>"
export async function createTableCookieValue(tableId: string) {
    return `${tableId}.${await signTable(tableId)}`
}

// Devuelve el id de la mesa si la cookie es válida, o null
export async function readTableCookie(value: string | undefined) {
    if (!value) return null
    const separator = value.lastIndexOf('.')
    if (separator < 1) return null
    const tableId = value.slice(0, separator)
    const signature = value.slice(separator + 1)
    return (await verifyTable(tableId, signature)) ? tableId : null
}
