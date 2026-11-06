import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { db } from "../db/client";
import { auditLog, bookingRooms, bookings, guests, payments, ratePlans, roomTypes } from "../db/schema";

/** Buchungsliste eines Hotels (immer nach hotel_id gefiltert, SPEC 0.5) */
export async function listBookings(hotelId: string, f: { from?: string; to?: string; status?: string; source?: string }) {
  const where: SQL[] = [eq(bookings.hotelId, hotelId)];
  if (f.from) where.push(gte(bookings.checkin, f.from));
  if (f.to) where.push(lte(bookings.checkin, f.to));
  if (f.status) where.push(eq(bookings.status, f.status));
  if (f.source) where.push(eq(bookings.source, f.source));
  return db()
    .select({ b: bookings, g: guests, rt: roomTypes })
    .from(bookings)
    .leftJoin(guests, eq(guests.id, bookings.guestId))
    .leftJoin(bookingRooms, eq(bookingRooms.bookingId, bookings.id))
    .leftJoin(roomTypes, eq(roomTypes.id, bookingRooms.roomTypeId))
    .where(and(...where))
    .orderBy(desc(bookings.checkin), desc(bookings.createdAt))
    .limit(500);
}

export async function bookingDetail(hotelId: string, bookingId: string) {
  const [b] = await db().select().from(bookings).where(and(eq(bookings.id, bookingId), eq(bookings.hotelId, hotelId)));
  if (!b) return null;
  const [g] = b.guestId ? await db().select().from(guests).where(eq(guests.id, b.guestId)) : [];
  const [room] = await db().select().from(bookingRooms).where(eq(bookingRooms.bookingId, b.id));
  const [rt] = room ? await db().select().from(roomTypes).where(eq(roomTypes.id, room.roomTypeId)) : [];
  const [rp] = room?.ratePlanId ? await db().select().from(ratePlans).where(eq(ratePlans.id, room.ratePlanId)) : [];
  const pays = await db().select().from(payments).where(eq(payments.bookingId, b.id));
  const log = await db().select().from(auditLog).where(and(eq(auditLog.hotelId, hotelId), eq(auditLog.entityId, b.id))).orderBy(auditLog.createdAt);
  return { booking: b, guest: g, room, roomType: rt, ratePlan: rp, payments: pays, log };
}
