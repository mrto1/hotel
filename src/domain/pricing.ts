import { assertInt, bpsOf } from "./money";
import type { Day } from "./dates";

export type PlanPricing = {
  baseOccupancy: number;
  extraAdultRappen: number;
  singleDiscountRappen: number;
};

export type NightlyPrice = { night: Day; price_rappen: number };

/** SPEC 5.2: Preis pro Nacht nach Belegung */
export function priceForNight(
  baseRappen: number,
  plan: PlanPricing,
  adults: number,
  children: number,
): number {
  assertInt(baseRappen, "price_rappen");
  let p = baseRappen;
  const persons = adults + children;
  if (persons === 1) p = Math.max(1, p - plan.singleDiscountRappen);
  if (adults > plan.baseOccupancy) p += (adults - plan.baseOccupancy) * plan.extraAdultRappen;
  return p;
}

export function priceStay(
  rates: { night: Day; priceRappen: number }[],
  plan: PlanPricing,
  adults: number,
  children: number,
): { nightly: NightlyPrice[]; roomsTotalRappen: number } {
  const nightly = rates.map((r) => ({
    night: r.night,
    price_rappen: priceForNight(r.priceRappen, plan, adults, children),
  }));
  return { nightly, roomsTotalRappen: nightly.reduce((s, n) => s + n.price_rappen, 0) };
}

/** SPEC 5.2: Plattformgebühr, mindestens 1 Rappen, kleiner als total */
export function platformFee(totalRappen: number, feeBps: number): number {
  if (totalRappen <= 1 || feeBps <= 0) return 0;
  const fee = bpsOf(totalRappen, feeBps);
  return Math.min(Math.max(fee, 1), totalRappen - 1);
}

export function grandTotal(roomsTotal: number, touristTax: number, taxIncluded: boolean): number {
  return taxIncluded ? roomsTotal : roomsTotal + touristTax;
}
