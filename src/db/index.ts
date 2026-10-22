import "server-only"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const globalForDb = globalThis as unknown as { pool?: Pool }

// DATABASE_URL es la del pooler de Neon (-pooler)
const pool = globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL! })
if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool

// El casing tiene que coincidir con el de drizzle.config.ts y el del seed
export const db = drizzle({ client: pool, schema, casing: "snake_case", logger: process.env.NODE_ENV !== 'production' })
