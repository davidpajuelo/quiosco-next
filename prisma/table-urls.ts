// Genera las URLs firmadas (para los QR) de cada mesa: npx tsx prisma/table-urls.ts [baseUrl]
import "dotenv/config";
import { signTable } from "../src/lib/table-session";

async function main() {
    const baseUrl = process.argv[2] ?? 'http://localhost:3000'
    for (const id of ['1', '2', '3']) {
        console.log(`Mesa ${id}: ${baseUrl}/mesa/${id}?firma=${await signTable(id)}`)
    }
}
main()
