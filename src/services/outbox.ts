import type { Executor } from "../db/client";
import { channexOutbox } from "../db/schema";

/**
 * SPEC 7.2: Jede Änderung an inventory_days/rates_days schreibt in DERSELBEN Transaktion einen Outbox-Eintrag.
 * date_to ist inklusiv.
 */
export async function enqueueAvailability(ex: Executor, hotelId: string, roomTypeId: string, dateFrom: string, dateTo: string) {
  await ex.insert(channexOutbox).values({ hotelId, kind: "availability", roomTypeId, dateFrom, dateTo });
}

export async function enqueueRestrictions(ex: Executor, hotelId: string, ratePlanId: string, dateFrom: string, dateTo: string) {
  await ex.insert(channexOutbox).values({ hotelId, kind: "restrictions", ratePlanId, dateFrom, dateTo });
}
