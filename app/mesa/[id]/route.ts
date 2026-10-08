import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"
import { TABLE_COOKIE, createTableCookieValue, verifyTable } from "@/src/lib/table-session"

// Entrada desde el QR de la mesa: /mesa/2?firma=<hmac>
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const firma = request.nextUrl.searchParams.get('firma') ?? ''
    const invalid = NextResponse.redirect(new URL('/mesa-invalida', request.url))

    // La firma impide cambiar el número de mesa editando la URL
    if (!(await verifyTable(params.id, firma))) {
        return invalid
    }
    const table = await prisma.table.findUnique({ where: { id: params.id } })
    if (!table) {
        return invalid
    }

    const response = NextResponse.redirect(new URL('/order', request.url))
    response.cookies.set(TABLE_COOKIE, await createTableCookieValue(table.id), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/'
    })
    return response
}
