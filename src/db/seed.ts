import "dotenv/config"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { categories as categoriesData } from "./data/categories"
import { products as productsData } from "./data/products"
import { tables as tablesData } from "./data/tables"
import { categories, products, tables } from "./schema"

// No importa ./index: server-only lanza fuera de Next. Solo sobre una BD vacía (categoryId 1..6)
async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    // Sin casing insertaría en "categoryId" en vez de category_id
    const db = drizzle({ client: pool, casing: "snake_case" })
    try {
        await db.transaction(async (tx) => {
            await tx.insert(categories).values(categoriesData)
            await tx.insert(products).values(productsData)
            await tx.insert(tables).values(tablesData)
        })
        console.log('Seed ejecutado correctamente')
    } finally {
        await pool.end()
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
