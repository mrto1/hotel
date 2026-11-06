import Stripe from "stripe";
import { requireEnv } from "../../env";

let client: Stripe | null = null;
let override: Stripe | null = null;

/** Für Tests: Stripe-Client ersetzen */
export function setStripeClient(s: Stripe | null) {
  override = s;
}

export function stripe(): Stripe {
  if (override) return override;
  if (!client) client = new Stripe(requireEnv("STRIPE_SECRET_KEY"), { appInfo: { name: "hotel-direktbuchung" } });
  return client;
}

export type { Stripe };
