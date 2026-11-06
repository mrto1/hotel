/**
 * Hintergrund-Jobs mit pg-boss (SPEC 2): eigener Prozess `npm run worker`.
 * - holds:   abgelaufene Holds freigeben (jede Minute, SPEC 5.5)
 * - emails:  E-Mail-Outbox senden (jede Minute, SPEC 10)
 * - horizon: Verfügbarkeit/Preise auf 18 Monate auffüllen (täglich 03:15, SPEC 4)
 * - channex-outbox / channex-feed: folgen in M3
 */
import { PgBoss } from "pg-boss";
import { env } from "../env";
import { expireHolds } from "../services/bookings";
import { sendDueEmails } from "../email/send";
import { extendHorizon } from "../services/inventory";

const jobs: { name: string; cron: string; run: () => Promise<unknown> }[] = [
  { name: "holds", cron: "* * * * *", run: () => expireHolds() },
  { name: "emails", cron: "* * * * *", run: () => sendDueEmails() },
  { name: "horizon", cron: "15 3 * * *", run: () => extendHorizon() },
];

async function main() {
  const boss = new PgBoss(env().DATABASE_URL);
  boss.on("error", (e) => console.error("[pg-boss]", e));
  await boss.start();
  for (const j of jobs) {
    await boss.createQueue(j.name);
    await boss.schedule(j.name, j.cron, null, { tz: "Europe/Zurich" });
    await boss.work(j.name, async () => {
      const r = await j.run();
      if (r && (typeof r === "number" ? r > 0 : true)) console.log(`[job ${j.name}]`, r);
    });
  }
  console.log("Worker läuft:", jobs.map((j) => `${j.name} (${j.cron})`).join(", "));
  const stop = async () => {
    await boss.stop({ graceful: true });
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
