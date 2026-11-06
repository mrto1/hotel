import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/** Kalendertage sind Strings 'YYYY-MM-DD' (SPEC 0.4). Rechnen immer in UTC, damit es keine Sommerzeitfehler gibt. */
export type Day = string;

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDay(s: string): boolean {
  if (!DAY_RE.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function addDays(day: Day, n: number): Day {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function diffDays(from: Day, to: Day): number {
  return Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000);
}

/** Nächte eines Aufenthalts: checkin .. checkout-1 */
export function nightsOf(checkin: Day, checkout: Day): Day[] {
  const n = diffDays(checkin, checkout);
  return Array.from({ length: Math.max(0, n) }, (_, i) => addDays(checkin, i));
}

/** Wochentag 0=So .. 6=Sa */
export function weekday(day: Day): number {
  return new Date(day + "T00:00:00Z").getUTCDay();
}

/** Heutiges Datum in der Zeitzone des Hotels */
export function todayIn(tz: string, now: Date = new Date()): Day {
  return formatInTimeZone(now, tz, "yyyy-MM-dd");
}

/** Lokale Zeit (Datum + 'HH:mm[:ss]') in einer Zeitzone → UTC-Zeitpunkt */
export function zonedToUtc(day: Day, time: string, tz: string): Date {
  const t = time.length === 5 ? time + ":00" : time;
  return fromZonedTime(`${day}T${t}`, tz);
}

/** Alter in vollen Jahren an einem Stichtag */
export function ageOn(birthDate: Day, onDay: Day): number {
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const [y, m, d] = onDay.split("-").map(Number);
  let age = y - by;
  if (m < bm || (m === bm && d < bd)) age--;
  return age;
}
