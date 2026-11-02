import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set before starting the API");
}

const databaseHost = new URL(databaseUrl).hostname;
if (!databaseHost.includes("-pooler")) {
  throw new Error("DATABASE_URL must use the Neon pooled connection host containing '-pooler'");
}
if (!databaseUrl.includes("sslmode=require")) {
  throw new Error("DATABASE_URL must include sslmode=require");
}

export const pool = new Pool({
  connectionString: databaseUrl,
  max: 5,
});

export const db = drizzle(pool, { schema });
