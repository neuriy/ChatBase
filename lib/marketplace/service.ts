/**
 * Marketplace service interface v1 — single entry for Settings UI + AI tools.
 * Caching: TTL for lists; ETag (content-hash) for individual resources.
 */

import { env } from "@/lib/config/env";
import {
  cacheGet,
  cacheInvalidate,
  cacheSet,
  etagMatches,
} from "./cache";
import {
  fetchApp,
  fetchApps,
  fetchCategories,
  fetchHealth,
  openAppPayload,
  MarketplaceHttpError,
  MarketplaceUnavailableError,
} from "./client";
import { sanitizeForUi, summarizeAppForAi } from "./sanitize";
import type { MarketplaceApp } from "./schemas";
import { logEvent } from "@/lib/observability/trace";

export const SERVICE_INTERFACE_VERSION = "marketplace.service.v1";

export type ConnectionStatus = "connected" | "degraded" | "down" | "disabled";

export type MarketplaceStatus = {
  interfaceVersion: string;
  featureEnabled: boolean;
  aiToolsEnabled: boolean;
  connection: ConnectionStatus;
  lastSuccessfulSync: string | null;
  health: unknown | null;
  error: string | null;
  cacheTtl: {
    listSec: number;
    itemSec: number;
    categoriesSec: number;
    healthSec: number;
  };
};

let lastSuccessfulSync: string | null = null;

function markSync() {
  lastSuccessfulSync = new Date().toISOString();
}

export function getMarketplaceStatusSnapshot(): MarketplaceStatus {
  return {
    interfaceVersion: SERVICE_INTERFACE_VERSION,
    featureEnabled: env.flags.marketplace,
    aiToolsEnabled: env.flags.marketplaceAiTools,
    connection: env.flags.marketplace ? "down" : "disabled",
    lastSuccessfulSync,
    health: null,
    error: null,
    cacheTtl: {
      listSec: env.cacheTtlListSec,
      itemSec: env.cacheTtlItemSec,
      categoriesSec: env.cacheTtlCategoriesSec,
      healthSec: env.cacheTtlHealthSec,
    },
  };
}

export async function getStatus(traceId: string): Promise<MarketplaceStatus> {
  const base = getMarketplaceStatusSnapshot();
  if (!env.flags.marketplace) {
    return { ...base, connection: "disabled" };
  }
  try {
    const healthKey = "health";
    let health = cacheGet<unknown>(healthKey)?.value ?? null;
    if (!health) {
      health = await fetchHealth(traceId);
      cacheSet(healthKey, health, env.cacheTtlHealthSec);
      markSync();
    }
    return {
      ...base,
      connection: "connected",
      health,
      lastSuccessfulSync,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unavailable";
    logEvent("warn", "marketplace.status_degraded", { traceId, error: msg });
    return {
      ...base,
      connection: lastSuccessfulSync ? "degraded" : "down",
      error: msg,
      lastSuccessfulSync,
    };
  }
}

export async function listCategories(
  traceId: string,
  opts?: { forceRefresh?: boolean }
) {
  assertFeature();
  const key = "categories";
  if (!opts?.forceRefresh) {
    const hit = cacheGet<string[]>(key);
    if (hit) return { categories: hit.value, etag: hit.etag, cached: true };
  }
  const categories = await fetchCategories(traceId);
  const entry = cacheSet(key, categories, env.cacheTtlCategoriesSec);
  markSync();
  return { categories, etag: entry.etag, cached: false };
}

export async function searchApps(
  traceId: string,
  params: {
    q?: string;
    category?: string;
    sort?: string;
    limit?: number;
  },
  opts?: { forceRefresh?: boolean; userBearer?: string; ifNoneMatch?: string }
) {
  assertFeature();
  const limit = Math.min(Math.max(params.limit ?? 12, 1), 50);
  const key = `apps:${params.q || ""}:${params.category || ""}:${params.sort || "popular"}`;

  if (!opts?.forceRefresh) {
    const hit = cacheGet<MarketplaceApp[]>(key);
    if (hit) {
      if (etagMatches(opts?.ifNoneMatch, hit.etag)) {
        return { notModified: true as const, etag: hit.etag, apps: [] as MarketplaceApp[] };
      }
      return {
        notModified: false as const,
        etag: hit.etag,
        apps: hit.value.slice(0, limit).map(publicApp),
        cached: true,
      };
    }
  }

  const { apps } = await fetchApps(
    traceId,
    {
      q: params.q,
      category: params.category,
      sort: params.sort,
    },
    { userBearer: opts?.userBearer }
  );
  const entry = cacheSet(key, apps, env.cacheTtlListSec);
  markSync();
  if (etagMatches(opts?.ifNoneMatch, entry.etag)) {
    return { notModified: true as const, etag: entry.etag, apps: [] as MarketplaceApp[] };
  }
  return {
    notModified: false as const,
    etag: entry.etag,
    apps: apps.slice(0, limit).map(publicApp),
    cached: false,
  };
}

export async function getApp(
  traceId: string,
  id: string,
  opts?: { forceRefresh?: boolean; userBearer?: string; ifNoneMatch?: string }
) {
  assertFeature();
  const key = `app:${id}`;
  if (!opts?.forceRefresh) {
    const hit = cacheGet<MarketplaceApp>(key);
    if (hit) {
      if (etagMatches(opts?.ifNoneMatch, hit.etag)) {
        return { notModified: true as const, etag: hit.etag, app: null };
      }
      return {
        notModified: false as const,
        etag: hit.etag,
        app: publicApp(hit.value),
        cached: true,
      };
    }
  }

  try {
    const { app } = await fetchApp(traceId, id, {
      userBearer: opts?.userBearer,
    });
    if (!app) throw new MarketplaceHttpError(404, "App not found");
    const entry = cacheSet(key, app, env.cacheTtlItemSec);
    markSync();
    if (etagMatches(opts?.ifNoneMatch, entry.etag)) {
      return { notModified: true as const, etag: entry.etag, app: null };
    }
    return {
      notModified: false as const,
      etag: entry.etag,
      app: publicApp(app),
      cached: false,
    };
  } catch (err) {
    if (err instanceof MarketplaceHttpError && err.status === 404) {
      throw err;
    }
    throw err;
  }
}

export async function openApp(traceId: string, id: string, userBearer?: string) {
  const result = await getApp(traceId, id, { userBearer });
  if (!result.app) throw new MarketplaceHttpError(404, "App not found");
  // Need raw app for open payload — re-fetch from cache
  const cached = cacheGet<MarketplaceApp>(`app:${id}`);
  const app = cached?.value || (result.app as unknown as MarketplaceApp);
  return openAppPayload(app);
}

export function refreshCache(scope?: string) {
  cacheInvalidate(scope);
  logEvent("info", "marketplace.cache_invalidated", { scope: scope || "all" });
}

export function toAiSearchResults(apps: MarketplaceApp[]) {
  return apps.map(summarizeAppForAi);
}

function publicApp(app: MarketplaceApp) {
  return {
    ...app,
    name: sanitizeForUi(app.name),
    description: sanitizeForUi(app.description || ""),
    developer: sanitizeForUi(app.developer || ""),
    category: sanitizeForUi(app.category || ""),
    moderation_notes: app.moderation_notes
      ? sanitizeForUi(app.moderation_notes)
      : app.moderation_notes,
  };
}

function assertFeature() {
  if (!env.flags.marketplace) {
    throw new MarketplaceUnavailableError(
      "Marketplace feature flag is disabled"
    );
  }
}

export {
  MarketplaceHttpError,
  MarketplaceUnavailableError,
};
