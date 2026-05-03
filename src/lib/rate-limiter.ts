/**
 * Sliding-Window Rate Limiter
 *
 * Optimization technique: instead of a fixed-window counter (which resets hard
 * at the boundary and allows a burst of 2× the limit straddling two windows),
 * this implementation uses a sliding window. It weights the previous window's
 * count by how much of it still falls inside the current look-back period,
 * giving a smooth, accurate estimate of the request rate at any instant.
 *
 * Algorithm:
 *   count = previousWindowCount × overlap + currentWindowCount
 *   where overlap = (windowMs - elapsedInCurrentWindow) / windowMs
 *
 * Storage: one entry per key (IP address) in a Map — O(1) lookup and update.
 * Expired entries are purged lazily on each check to bound memory use.
 *
 * Trade-off: in-memory only, so limits are per-process and do not survive
 * restarts. For multi-instance deployments, swap the Map for a Redis store
 * without changing the algorithm.
 */

interface WindowEntry {
  previousCount: number;
  currentCount: number;
  windowStart: number;
}

interface RateLimiterOptions {
  /** Length of each time window in milliseconds. */
  windowMs: number;
  /** Maximum number of requests allowed per window. */
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAfterMs: number;
}

export class SlidingWindowRateLimiter {
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly store = new Map<string, WindowEntry>();

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
  }

  check(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      this.store.set(key, { previousCount: 0, currentCount: 1, windowStart: now });
      return { allowed: true, remaining: this.maxRequests - 1, resetAfterMs: this.windowMs };
    }

    const elapsed = now - entry.windowStart;

    if (elapsed >= this.windowMs * 2) {
      // Both windows have expired — reset completely.
      this.store.set(key, { previousCount: 0, currentCount: 1, windowStart: now });
      return { allowed: true, remaining: this.maxRequests - 1, resetAfterMs: this.windowMs };
    }

    if (elapsed >= this.windowMs) {
      // Current window has expired — slide: current becomes previous.
      entry.previousCount = entry.currentCount;
      entry.currentCount = 0;
      entry.windowStart = entry.windowStart + this.windowMs;
    }

    // Overlap: fraction of the previous window still inside the look-back period.
    const elapsedInCurrentWindow = now - entry.windowStart;
    const overlap = (this.windowMs - elapsedInCurrentWindow) / this.windowMs;
    const weightedCount = entry.previousCount * overlap + entry.currentCount;

    if (weightedCount >= this.maxRequests) {
      const resetAfterMs = this.windowMs - elapsedInCurrentWindow;
      return { allowed: false, remaining: 0, resetAfterMs };
    }

    entry.currentCount += 1;
    const remaining = Math.max(0, Math.floor(this.maxRequests - weightedCount - 1));
    return { allowed: true, remaining, resetAfterMs: this.windowMs - elapsedInCurrentWindow };
  }

  /** Remove entries for keys that have been inactive for two full windows. */
  purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now - entry.windowStart >= this.windowMs * 2) {
        this.store.delete(key);
      }
    }
  }
}

// Shared limiter instance: 5 auth attempts per 15 minutes per IP.
// Using globalThis so the singleton survives Next.js hot-reloads in dev.
const globalKey = "__sprintflow_auth_rate_limiter__";
declare global {
  var __sprintflow_auth_rate_limiter__: SlidingWindowRateLimiter | undefined;
}

export const authRateLimiter: SlidingWindowRateLimiter =
  globalThis[globalKey] ??
  (globalThis[globalKey] = new SlidingWindowRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  }));
