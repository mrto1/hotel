/**
 * Einfaches Rate-Limit pro Schlüssel (z. B. IP) im Speicher (SPEC 8: z. B. 10 POST pro Minute und IP).
 */
// ASSUMPTION: In-Memory reicht für eine Instanz. Bei mehreren Instanzen auf Postgres oder Proxy-Limit umstellen.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 10, windowMs = 60_000, now = Date.now()): boolean {
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    return true;
  }
  b.count++;
  return b.count <= limit;
}

export function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
