// Identificación de la mesa del cliente mediante cookie
export const TABLE_COOKIE = 'mesa'

// Mesa usada para los pedidos hechos desde el panel de administración
export const ADMIN_TABLE_ID = '0'

// Devuelve el id de la mesa guardado en la cookie, o null
export function readTableCookie(value: string | undefined) {
    return value || null
}
