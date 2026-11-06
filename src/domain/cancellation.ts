import { bpsOf } from "./money";
import { zonedToUtc, type Day } from "./dates";

/** SPEC 5.7 */
export type CancelInput = {
  totalRappen: number;
  roomsTotalRappen: number;
  freeCancelHours: number | null;
  cancelFeeBps: number;
  checkin: Day;
  checkinTime: string; // 'HH:mm[:ss]'
  timezone: string;
  now: Date;
  byHotel?: boolean;
};

export type CancelQuote = {
  refundRappen: number;
  feeRappen: number;
  free: boolean;
  deadline: Date | null;
};

export function cancellationDeadline(i: Pick<CancelInput, "freeCancelHours" | "checkin" | "checkinTime" | "timezone">): Date | null {
  if (i.freeCancelHours === null) return null;
  const checkinAt = zonedToUtc(i.checkin, i.checkinTime, i.timezone);
  return new Date(checkinAt.getTime() - i.freeCancelHours * 3600_000);
}

export function quoteCancellation(i: CancelInput): CancelQuote {
  const deadline = cancellationDeadline(i);
  if (i.byHotel) return { refundRappen: i.totalRappen, feeRappen: 0, free: true, deadline };
  if (deadline && i.now.getTime() <= deadline.getTime()) {
    return { refundRappen: i.totalRappen, feeRappen: 0, free: true, deadline };
  }
  const fee = Math.min(bpsOf(i.roomsTotalRappen, i.cancelFeeBps), i.totalRappen);
  return { refundRappen: i.totalRappen - fee, feeRappen: fee, free: false, deadline };
}

/** Stornoregel als Text (DE/EN) */
export function cancellationPolicyText(
  plan: { freeCancelHours: number | null; cancelFeeBps: number },
  lang: "de" | "en",
): string {
  const pct = plan.cancelFeeBps / 100;
  if (plan.freeCancelHours === null) {
    return lang === "de"
      ? pct >= 100
        ? "Nicht stornierbar. Bei Stornierung wird der Zimmerpreis nicht erstattet (Kurtaxe schon)."
        : `Bei Stornierung werden ${pct} % des Zimmerpreises verrechnet.`
      : pct >= 100
        ? "Non-refundable. The room price is not refunded on cancellation (tourist tax is)."
        : `On cancellation, ${pct}% of the room price is charged.`;
  }
  const h = plan.freeCancelHours;
  const when = h % 24 === 0 ? (lang === "de" ? `${h / 24} Tag(e)` : `${h / 24} day(s)`) : `${h} h`;
  return lang === "de"
    ? `Kostenlos stornierbar bis ${when} vor Anreise (Check-in-Zeit). Danach ${pct} % des Zimmerpreises.`
    : `Free cancellation until ${when} before arrival (check-in time). After that ${pct}% of the room price.`;
}
