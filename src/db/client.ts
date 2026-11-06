import pg from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { env } from "../env";

// DATE (oid 1082) als 'YYYY-MM-DD'-String lassen, nie in JS-Date umwandeln (Zeitzonenfehler).
pg.types.setTypeParser(1082, (v) => v);
// bigint/count als number
pg.types.setTypeParser(20, (v) => Number(v));

export type DB = NodePgDatabase<typeof schema>;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
export type Executor = DB | Tx;

const g = globalThis as unknown as { __pool?: pg.Pool; __db?: DB };

export function pool(): pg.Pool {
  if (!g.__pool) {
    g.__pool = new pg.Pool({ connectionString: env().DATABASE_URL, max: 25 });
  }
  return g.__pool;
}

export function db(): DB {
  if (!g.__db) g.__db = drizzle(pool(), { schema });
  return g.__db;
}

export async function closeDb() {
  if (g.__pool) await g.__pool.end();
  g.__pool = undefined;
  g.__db = undefined;
}

/** Ergebnis-Zeilen aus tx.execute() typisieren. */
export function rows<T>(res: { rows: unknown[] }): T[] {
  return res.rows as T[];
}
