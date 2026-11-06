import { verifyChannexSignature } from "@/src/integrations/channex/signature";
import { env } from "@/src/env";

export const dynamic = "force-dynamic";

/**
 * SPEC 7.3 – Grundgerüst. Verarbeitung der Buchungen (Feed + Ack) folgt in M3.
 * Schon jetzt: falsche Signatur → 401.
 */
export async function POST(req: Request) {
  const secret = env().CHANNEX_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "channex_not_configured" }, { status: 503 });
  const raw = await req.text();
  const ok = verifyChannexSignature(raw, req.headers.get("x-hmac-signature-256"), req.headers.get("x-hmac-timestamp"), secret);
  if (!ok) return Response.json({ error: "invalid_signature" }, { status: 401 });
  // TODO(M3): Job channex-feed anstossen (src/jobs), siehe SPEC 7.3
  return Response.json({ received: true }, { status: 202 });
}
