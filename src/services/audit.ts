import type { Executor } from "../db/client";
import { auditLog } from "../db/schema";

export async function audit(
  ex: Executor,
  e: { hotelId: string | null; actor: string; action: string; entity?: string; entityId?: string; details?: Record<string, unknown> },
) {
  await ex.insert(auditLog).values({
    hotelId: e.hotelId,
    actor: e.actor,
    action: e.action,
    entity: e.entity ?? null,
    entityId: e.entityId ?? null,
    details: e.details ?? {},
  });
}
