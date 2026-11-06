import crypto from "node:crypto";

/**
 * SPEC 7.3 / Channex-Doku (Webhook Collection, HMAC signing):
 * signature = lowercase_hex(HMAC_SHA256(secret, "<timestamp>.<raw_request_body>"))
 * - x-hmac-timestamp: Unix-Sekunden
 * - x-hmac-signature-256: kommagetrennte Hex-Signaturen (zwei während Schlüsselwechsel)
 * Zeitstempel höchstens 300 s Abweichung, konstantzeitiger Vergleich.
 */
export function verifyChannexSignature(rawBody: string, signature: string | null, timestamp: string | null, secret: string, nowMs = Date.now()): boolean {
  if (!signature || !timestamp) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowMs / 1000 - ts) > 300) return false;
  const expected = Buffer.from(crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex"));
  return signature.split(",").some((s) => {
    const b = Buffer.from(s.trim().toLowerCase());
    return b.length === expected.length && crypto.timingSafeEqual(b, expected);
  });
}

export function signChannex(rawBody: string, secret: string, timestamp: number): string {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}
