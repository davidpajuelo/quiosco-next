import "dotenv/config"
import { defineConfig } from "drizzle-kit"

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/db/schema/*.ts",
    out: "./drizzle",
    casing: "snake_case",
    // Conexión directa (host sin -pooler): drizzle-kit no debe ir por el pooler
    dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED! }
})
