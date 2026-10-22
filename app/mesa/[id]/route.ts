import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/src/db"
import { tables } from "@/src/db/schema"
import { TABLE_COOKIE } from "@/src/lib/table-session"

// Entrada desde el QR de la mesa: /mesa/2
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const table = await db.query.tables.findFirst({ where: eq(tables.id, params.id) })
    if (!table) {
        return NextResponse.redirect(new URL('/mesa-invalida', request.url))
    }

    const response = NextResponse.redirect(new URL('/order', request.url))
    response.cookies.set(TABLE_COOKIE, table.id, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/'
    })
    return response
}
