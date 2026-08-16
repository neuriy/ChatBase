/**
 * Per-user rate limiter for marketplace tool invocations.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  userKey: string,
  limitPerMinute: number
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const key = userKey || "anonymous";
  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + 60_000 };
    buckets.set(key, bucket);
  }
  if (bucket.count >= limitPerMinute) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count += 1;
  return { ok: true };
}

/** Test helper */
export function _resetRateLimits() {
  buckets.clear();
}
