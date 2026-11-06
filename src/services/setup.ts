import { db, type Executor } from "../db/client";
import { hotelMembers, hotels, ratePlans, ratesDays, roomTypes, users } from "../db/schema";
import { addDays, nightsOf, todayIn, weekday } from "../domain/dates";
import { ensureInventory, HORIZON_DAYS } from "./inventory";

export type RoomSpec = {
  name: string;
  description?: string;
  roomCount: number;
  maxAdults: number;
  maxChildren: number;
  maxOccupancy: number;
  basePriceRappen: number;
};

export type HotelSpec = {
  slug: string;
  name: string;
  canton: string;
  municipality: string;
  contactEmail: string;
  primaryDomain?: string | null;
  status?: "draft" | "live" | "paused";
  content?: (typeof hotels.$inferInsert)["content"];
  rooms: RoomSpec[];
  /** Zuschlag Fr/Sa pro Nacht */
  weekendSurchargeRappen?: number;
  /** Mindestnächte bei Anreise am Samstag */
  saturdayMinStay?: number;
  horizonDays?: number;
};

/**
 * Legt ein Hotel mit Zimmertypen, je 2 Rateplänen (Flexibel, Nicht stornierbar −10 %),
 * Verfügbarkeit und Preisen an (SPEC 12.6).
 */
export async function createHotelWithRooms(spec: HotelSpec, ex: Executor = db()) {
  const [hotel] = await ex
    .insert(hotels)
    .values({
      slug: spec.slug,
      name: spec.name,
      canton: spec.canton,
      municipality: spec.municipality,
      contactEmail: spec.contactEmail,
      primaryDomain: spec.primaryDomain ?? null,
      status: spec.status ?? "live",
      content: spec.content ?? {},
    })
    .returning();
  const today = todayIn(hotel.timezone);
  const horizon = spec.horizonDays ?? HORIZON_DAYS;
  const end = addDays(today, horizon);
  const nights = nightsOf(today, end);
  const created: { roomType: typeof roomTypes.$inferSelect; plans: (typeof ratePlans.$inferSelect)[] }[] = [];

  for (const [i, r] of spec.rooms.entries()) {
    const [rt] = await ex
      .insert(roomTypes)
      .values({
        hotelId: hotel.id,
        name: r.name,
        description: r.description ?? null,
        roomCount: r.roomCount,
        maxAdults: r.maxAdults,
        maxChildren: r.maxChildren,
        maxOccupancy: r.maxOccupancy,
        sortOrder: i,
      })
      .returning();
    await ensureInventory(ex, hotel.id, rt.id, today, end);
    const plans = await ex
      .insert(ratePlans)
      .values([
        { hotelId: hotel.id, roomTypeId: rt.id, name: "Flexibel", freeCancelHours: 48, cancelFeeBps: 10000, baseOccupancy: Math.min(2, r.maxAdults), extraAdultRappen: 4000, singleDiscountRappen: r.maxOccupancy > 1 ? 2000 : 0 },
        { hotelId: hotel.id, roomTypeId: rt.id, name: "Nicht stornierbar", freeCancelHours: null, cancelFeeBps: 10000, baseOccupancy: Math.min(2, r.maxAdults), extraAdultRappen: 4000, singleDiscountRappen: r.maxOccupancy > 1 ? 2000 : 0 },
      ])
      .returning();
    for (const [pi, p] of plans.entries()) {
      const values = nights.map((night) => {
        const wd = weekday(night);
        let price = r.basePriceRappen + (wd === 5 || wd === 6 ? (spec.weekendSurchargeRappen ?? 0) : 0);
        if (pi === 1) price = Math.round(price * 0.9);
        return {
          hotelId: hotel.id,
          ratePlanId: p.id,
          night,
          priceRappen: price,
          minStayArrival: wd === 6 ? (spec.saturdayMinStay ?? 1) : 1,
        };
      });
      for (let k = 0; k < values.length; k += 500) await ex.insert(ratesDays).values(values.slice(k, k + 500));
    }
    created.push({ roomType: rt, plans });
  }
  return { hotel, rooms: created };
}

export async function createUser(email: string, opts: { name?: string; platformAdmin?: boolean; hotelId?: string; role?: "owner" | "manager" | "staff" } = {}, ex: Executor = db()) {
  const [u] = await ex
    .insert(users)
    .values({ email: email.toLowerCase(), name: opts.name ?? null, isPlatformAdmin: opts.platformAdmin ?? false })
    .onConflictDoUpdate({ target: users.email, set: { name: opts.name ?? null } })
    .returning();
  if (opts.hotelId) {
    await ex.insert(hotelMembers).values({ hotelId: opts.hotelId, userId: u.id, role: opts.role ?? "owner" }).onConflictDoNothing();
  }
  return u;
}
