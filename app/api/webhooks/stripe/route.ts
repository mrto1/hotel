import { handleStripeEvent, verifyStripeEvent, WebhookSignatureError } from "@/src/integrations/stripe/webhooks";

export const dynamic = "force-dynamic";

/** SPEC 6.3: Ereignisse auf verbundenen Konten. Body roh lesen. */
export async function POST(req: Request) {
  const raw = await req.text();
  let event;
  try {
    event = verifyStripeEvent(raw, req.headers.get("stripe-signature"));
  } catch (e) {
    if (e instanceof WebhookSignatureError) return Response.json({ error: "invalid_signature" }, { status: 400 });
    throw e;
  }
  try {
    const r = await handleStripeEvent(event);
    return Response.json({ received: true, result: r });
  } catch (e) {
    console.error("stripe webhook", event.id, e);
    return Response.json({ error: "processing_failed" }, { status: 500 });
  }
}
