/**
 * Minimal in-memory rate limiter for the public API routes.
 *
 * NOTE: this is per server instance (works in local/single-instance dev).
 * In a multi-instance deployment (e.g. Vercel) it should be backed by a shared
 * store (Upstash/KV, Postgres, etc.) — see Phase 13 notes in PROGRESS.md.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  max = MAX_REQUESTS,
  windowMs = WINDOW_MS,
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  entry.count += 1;
  if (entry.count > max) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

/** Best-effort client identifier for rate limiting (IP from the proxy). */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? "unknown";
  return "unknown";
}