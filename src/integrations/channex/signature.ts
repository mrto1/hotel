import crypto from "node:crypto";

/**
 * SPEC 7.3: HMAC-SHA256 über `${timestamp}.${raw_body}` mit CHANNEX_WEBHOOK_SECRET,
 * Header x-hmac-signature-256 (hex), Zeitstempel x-hmac-timestamp (Sekunden) höchstens 300 s alt.
 */
// ASSUMPTION: Signatur als Hex-String und Zeitstempel in Unix-Sekunden – vor M3 gegen die Channex-Doku prüfen (QUESTIONS.md).
export function verifyChannexSignature(rawBody: string, signature: string | null, timestamp: string | null, secret: string, nowMs = Date.now()): boolean {
  if (!signature || !timestamp) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowMs / 1000 - ts) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature.trim().toLowerCase());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
