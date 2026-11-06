import { PgBoss } from "pg-boss";
import { env } from "../env";

/** Jobs aus dem Web-Prozess anstossen (ohne Scheduler/Supervisor – die laufen im Worker). */
let boss: PgBoss | null = null;
let starting: Promise<PgBoss> | null = null;

async function client(): Promise<PgBoss> {
  if (boss) return boss;
  if (!starting) {
    starting = (async () => {
      const b = new PgBoss({ connectionString: env().DATABASE_URL, supervise: false, schedule: false });
      b.on("error", (e) => console.error("[pg-boss]", e));
      await b.start();
      await b.createQueue("channex-feed");
      boss = b;
      return b;
    })();
  }
  return starting;
}

type Trigger = () => Promise<void>;
let override: Trigger | null = null;
export function setFeedTrigger(t: Trigger | null) {
  override = t;
}

/** SPEC 7.3: Webhook stösst nur den Job channex-feed an (dedupliziert innerhalb von 10 s) */
export async function triggerChannexFeed(): Promise<void> {
  if (override) return override();
  const b = await client();
  await b.send("channex-feed", {}, { singletonKey: "channex-feed", singletonSeconds: 10 });
}
