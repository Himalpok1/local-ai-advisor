/** Tiny in-memory fixed-window limiter (per process) to protect the Hub token. */
const hits = new Map<string, { start: number; count: number }>();

export function rateLimited(key: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now - h.start > windowMs) {
    hits.set(key, { start: now, count: 1 });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  h.count++;
  return h.count > limit;
}

export function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "anon";
}
