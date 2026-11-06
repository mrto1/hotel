/**
 * Wendet db/migrations/*.sql in Reihenfolge an (Tabelle schema_migrations).
 * --reset löscht vorher das Schema public (nur Entwicklung/Test!).
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

export async function migrate(databaseUrl: string, opts: { reset?: boolean; quiet?: boolean } = {}) {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    if (opts.reset) {
      if (process.env.NODE_ENV === "production") throw new Error("--reset in production verboten");
      await client.query("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;");
      await client.query("DROP SCHEMA IF EXISTS pgboss CASCADE;");
    }
    await client.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    const dir = path.join(process.cwd(), "db", "migrations");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
    const done = new Set((await client.query("SELECT name FROM schema_migrations")).rows.map((r) => r.name));
    for (const f of files) {
      if (done.has(f)) continue;
      const sql = fs.readFileSync(path.join(dir, f), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations(name) VALUES ($1)", [f]);
        await client.query("COMMIT");
        if (!opts.quiet) console.log("migriert:", f);
      } catch (e) {
        await client.query("ROLLBACK");
        throw new Error(`Migration ${f} fehlgeschlagen: ${(e as Error).message}`);
      }
    }
  } finally {
    await client.end();
  }
}

const isMain = process.argv[1] && process.argv[1].endsWith("migrate.ts");
if (isMain) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL fehlt");
  migrate(url, { reset: process.argv.includes("--reset") }).then(
    () => console.log("Migrationen fertig"),
    (e) => {
      console.error(e);
      process.exit(1);
    },
  );
}
