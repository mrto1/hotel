import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db, closeDb } from "../../src/db/client";
import { bookings } from "../../src/db/schema";
import { createDirectBooking, cancelBooking } from "../../src/services/bookings";
import { monthlyReport, reportCsv, isMonth } from "../../src/services/report";
import { addDays, todayIn } from "../../src/domain/dates";
import { guest, inDays, makeHotel } from "../helpers";

afterAll(closeDb);

describe("Monatsabrechnung", () => {
  it("summiert nach Quelle, Gebühr netto nach Rückerstattung, nur eigenes Hotel", async () => {
    const h = await makeHotel();
    const other = await makeHotel();
    const book = (hh: typeof h, d: string, n: number) =>
      createDirectBooking(hh.hotel, { roomTypeId: hh.rooms[0].roomType.id, ratePlanId: hh.rooms[0].plans[0].id, checkin: d, checkout: addDays(d, n), adults: 2, children: 0, childrenAges: [], guest });
    const a = await book(h, inDays(20), 2);
    const b = await book(h, inDays(25), 1);
    await book(other, inDays(20), 3);
    await cancelBooking(b.booking.id, { by: "guest", actor: "guest" }); // vor Frist → voll erstattet
    // Eine Buchung im Vormonat darf nicht zählen
    const c = await book(h, inDays(30), 1);
    await db().update(bookings).set({ confirmedAt: new Date(Date.now() - 62 * 86400_000) }).where(eq(bookings.id, c.booking.id));

    const month = todayIn("Europe/Zurich").slice(0, 7);
    const r = await monthlyReport(h.hotel.id, month);
    expect(r.lines.map((l) => l.reference).sort()).toEqual([a.booking.reference, b.booking.reference].sort());
    const [direct] = r.summary;
    expect(direct).toMatchObject({ source: "direct", bookings: 2, nights: 3 });
    expect(direct.revenue_rappen).toBe(a.booking.totalRappen + b.booking.totalRappen);
    expect(direct.refunded_rappen).toBe(b.booking.totalRappen);
    expect(direct.fee_rappen).toBe(a.booking.platformFeeRappen + b.booking.platformFeeRappen);
    expect(direct.net_fee_rappen).toBe(a.booking.platformFeeRappen); // b voll erstattet → Gebühr zurück
    const csv = reportCsv(r);
    expect(csv.startsWith("﻿Referenz;")).toBe(true);
    expect(csv).toContain(a.booking.reference);
    expect(csv.trim().split("\r\n")).toHaveLength(4); // Kopf + 2 + Total
    expect(isMonth("2026-13")).toBe(false);
    await expect(monthlyReport(h.hotel.id, "2026-1")).rejects.toThrow();
  });
});
