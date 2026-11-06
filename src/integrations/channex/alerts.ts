import { db } from "../../db/client";
import type { Hotel } from "../../db/schema";
import { env } from "../../env";
import { enqueueEmail } from "../../email/enqueue";
import { audit } from "../../services/audit";

/** Alarm an die Plattform (SPEC 7.2/5.6): E-Mail an PLATFORM_ALERT_EMAIL + audit_log */
export async function channexAlert(hotel: Hotel | null, subject: string, details: string) {
  const to = env().PLATFORM_ALERT_EMAIL;
  if (to) {
    await enqueueEmail(db(), { hotelId: hotel?.id ?? null, template: "channex_alert", to, data: { subject, details, hotel: hotel?.name ?? null } });
  }
  await audit(db(), { hotelId: hotel?.id ?? null, actor: "channex", action: "channex.alert", details: { subject, details: details.slice(0, 2000) } });
  console.error(`[channex] ${hotel?.name ?? "-"}: ${subject} – ${details}`);
}
