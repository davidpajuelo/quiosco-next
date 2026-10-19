import { NextRequest, NextResponse } from "next/server"
import { TABLE_COOKIE, readTableCookie } from "@/src/lib/table-session"

// Sin una mesa identificada no se puede acceder al pedido
export function middleware(request: NextRequest) {
    const tableId = readTableCookie(request.cookies.get(TABLE_COOKIE)?.value)
    if (!tableId) {
        return NextResponse.redirect(new URL('/mesa-invalida', request.url))
    }
    return NextResponse.next()
}

export const config = {
    matcher: ['/order/:path*']
}
