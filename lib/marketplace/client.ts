/**
 * Low-level Marketplace HTTP client — mirrors Neuriy-Marketplace Python SDK.
 * Never call this from the browser; use the service layer + app/api routes.
 */

import { env } from "@/lib/config/env";
import { logEvent, withTraceHeaders } from "@/lib/observability/trace";
import {
  MarketplaceValidationError,
  validateApp,
  validateApps,
  validateCategories,
  validateHealth,
  type MarketplaceApp,
} from "./schemas";

export class MarketplaceHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "MarketplaceHttpError";
    this.status = status;
  }
}

export class MarketplaceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MarketplaceUnavailableError";
  }
}

type FetchOpts = {
  traceId: string;
  path: string;
  query?: Record<string, string | undefined>;
  ifNoneMatch?: string;
  userBearer?: string;
};

async function marketplaceFetch({
  traceId,
  path,
  query,
  ifNoneMatch,
  userBearer,
}: FetchOpts): Promise<{ status: number; etag: string | null; json: unknown | null; notModified: boolean }> {
  const url = new URL(env.marketplaceUrl + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v != null && v !== "") url.searchParams.set(k, v);
    }
  }

  const headers = withTraceHeaders(traceId, {
    Accept: "application/json",
  });
  const token = userBearer || env.marketplaceToken;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (ifNoneMatch) headers["If-None-Match"] = ifNoneMatch;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), env.marketplaceTimeoutMs);
  const started = Date.now();

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers,
      signal: ctrl.signal,
      cache: "no-store",
    });

    logEvent("info", "marketplace.fetch", {
      traceId,
      path,
      status: res.status,
      latencyMs: Date.now() - started,
    });

    if (res.status === 304) {
      return {
        status: 304,
        etag: res.headers.get("etag"),
        json: null,
        notModified: true,
      };
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new MarketplaceHttpError(
        res.status,
        detail.slice(0, 300) || res.statusText
      );
    }

    const json = await res.json();
    return {
      status: res.status,
      etag: res.headers.get("etag"),
      json,
      notModified: false,
    };
  } catch (err) {
    if (err instanceof MarketplaceHttpError) throw err;
    const msg = err instanceof Error ? err.message : "unknown";
    logEvent("error", "marketplace.fetch_failed", { traceId, path, error: msg });
    throw new MarketplaceUnavailableError(
      `Marketplace temporarily unavailable (${msg})`
    );
  } finally {
    clearTimeout(t);
  }
}

export async function fetchHealth(traceId: string) {
  const { json } = await marketplaceFetch({ traceId, path: "/health" });
  return validateHealth(json);
}

export async function fetchCategories(traceId: string) {
  const { json } = await marketplaceFetch({
    traceId,
    path: "/api/categories",
  });
  return validateCategories(json);
}

export async function fetchApps(
  traceId: string,
  params: {
    q?: string;
    category?: string;
    sort?: string;
    featured?: string;
    status?: string;
  },
  opts?: { ifNoneMatch?: string; userBearer?: string }
): Promise<{ apps: MarketplaceApp[]; notModified: boolean; upstreamEtag: string | null }> {
  const { json, notModified, etag } = await marketplaceFetch({
    traceId,
    path: "/api/apps",
    query: {
      q: params.q,
      category: params.category,
      sort: params.sort || "popular",
      featured: params.featured,
      status: params.status || "approved",
    },
    ifNoneMatch: opts?.ifNoneMatch,
    userBearer: opts?.userBearer,
  });
  if (notModified) {
    return { apps: [], notModified: true, upstreamEtag: etag };
  }
  try {
    return { apps: validateApps(json), notModified: false, upstreamEtag: etag };
  } catch (e) {
    logEvent("error", "marketplace.invalid_apps", {
      traceId,
      error: e instanceof Error ? e.message : "invalid",
    });
    throw e;
  }
}

export async function fetchApp(
  traceId: string,
  id: string,
  opts?: { ifNoneMatch?: string; userBearer?: string }
): Promise<{ app: MarketplaceApp | null; notModified: boolean; upstreamEtag: string | null }> {
  const { json, notModified, etag } = await marketplaceFetch({
    traceId,
    path: `/api/apps/${encodeURIComponent(id)}`,
    ifNoneMatch: opts?.ifNoneMatch,
    userBearer: opts?.userBearer,
  });
  if (notModified) {
    return { app: null, notModified: true, upstreamEtag: etag };
  }
  try {
    return { app: validateApp(json), notModified: false, upstreamEtag: etag };
  } catch (e) {
    if (e instanceof MarketplaceValidationError) throw e;
    throw e;
  }
}

export function openAppPayload(app: MarketplaceApp) {
  return {
    type: "neuriy.marketplace.open_app" as const,
    app,
    actions: [
      {
        label: "Open in Marketplace",
        url: `${env.marketplaceStoreUrl}/Apps/Details/${encodeURIComponent(app.id)}`,
      },
      {
        label: "Download for Neuriy AI",
        url: `${env.marketplaceUrl}/api/apps/${encodeURIComponent(app.id)}/download`,
      },
    ],
    chat_card: {
      title: app.name,
      subtitle: `${app.developer} · ${app.category} · ${app.price}`,
      body: app.description,
      status: app.status,
      score: app.moderation_score,
    },
  };
}
