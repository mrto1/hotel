/** SPEC 5.8 */
export type BookingStatus = "hold" | "confirmed" | "expired" | "cancelled" | "no_show";

const allowed: Record<BookingStatus, BookingStatus[]> = {
  hold: ["confirmed", "expired"],
  expired: ["confirmed"],
  confirmed: ["cancelled", "no_show"],
  cancelled: [],
  no_show: [],
};

export class InvalidTransitionError extends Error {
  constructor(public from: string, public to: string) {
    super(`Ungültiger Statuswechsel ${from} → ${to}`);
  }
}

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return allowed[from]?.includes(to) ?? false;
}

export function assertTransition(from: string, to: BookingStatus): void {
  if (!canTransition(from as BookingStatus, to)) throw new InvalidTransitionError(from, to);
}
