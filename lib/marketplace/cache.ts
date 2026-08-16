/**
 * In-process TTL + ETag cache for Marketplace responses.
 * Marketplace API does not emit ETags; we hash payloads for If-None-Match.
 */

import { createHash } from "crypto";

export type CacheEntry<T> = {
  value: T;
  etag: string;
  expiresAt: number;
  storedAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

export function etagFor(payload: unknown): string {
  const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
  const hash = createHash("sha256").update(raw).digest("hex").slice(0, 32);
  return `"${hash}"`;
}

export function cacheGet<T>(key: string): CacheEntry<T> | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry;
}

export function cacheSet<T>(
  key: string,
  value: T,
  ttlSec: number
): CacheEntry<T> {
  const entry: CacheEntry<T> = {
    value,
    etag: etagFor(value),
    expiresAt: Date.now() + ttlSec * 1000,
    storedAt: Date.now(),
  };
  store.set(key, entry as CacheEntry<unknown>);
  return entry;
}

export function cacheInvalidate(prefixOrKey?: string) {
  if (!prefixOrKey) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key === prefixOrKey || key.startsWith(prefixOrKey)) {
      store.delete(key);
    }
  }
}

export function cacheStats() {
  return { size: store.size, keys: [...store.keys()] };
}

/** Match client If-None-Match against stored etag. */
export function etagMatches(
  ifNoneMatch: string | null | undefined,
  etag: string
): boolean {
  if (!ifNoneMatch) return false;
  const parts = ifNoneMatch.split(",").map((p) => p.trim());
  return parts.includes("*") || parts.includes(etag);
}
