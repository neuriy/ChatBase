"use client";

import React, { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import Link from "next/link";
import {
  Search,
  Store,
  Upload,
  RefreshCw,
  Star,
  ExternalLink,
  Bot,
  Package,
} from "lucide-react";

type AppItem = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  developer?: string;
  price?: string;
  version?: string;
  rating?: number;
  downloads?: number;
  featured?: boolean;
  icon_url?: string | null;
  status?: string;
};

type StatusPayload = {
  featureEnabled: boolean;
  aiToolsEnabled: boolean;
  connection: string;
  apiBaseUrl?: string;
  storeUrl?: string;
  error?: string | null;
};

function resolveIcon(apiBase: string, icon?: string | null) {
  if (!icon) return null;
  if (icon.startsWith("http")) return icon;
  return `${apiBase.replace(/\/$/, "")}${icon.startsWith("/") ? "" : "/"}${icon}`;
}

function Stars({ rating = 0 }: { rating?: number }) {
  const filled = Math.round(Math.min(5, Math.max(0, rating)));
  return (
    <span className="inline-flex gap-0.5 text-[11px] tracking-tight" aria-label={`${rating} stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${
            i < filled
              ? "fill-[#1e6fff] text-[#1e6fff]"
              : "fill-transparent text-neutral-300 dark:text-neutral-600"
          }`}
        />
      ))}
    </span>
  );
}

function AppTile({
  app,
  apiBase,
}: {
  app: AppItem;
  apiBase: string;
}) {
  const icon = resolveIcon(apiBase, app.icon_url);
  return (
    <Link
      href={`/marketplace/${encodeURIComponent(app.id)}`}
      className="group flex flex-col items-start gap-2 p-3 rounded-xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 hover:border-[#1e6fff]/50 hover:shadow-md transition-all min-w-[140px] w-[148px]"
    >
      <div className="w-14 h-14 rounded-xl bg-[#e8f1ff] dark:bg-blue-950/40 flex items-center justify-center overflow-hidden">
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" className="w-12 h-12 object-contain" />
        ) : (
          <Package className="w-7 h-7 text-[#1e6fff]" />
        )}
      </div>
      <span className="text-xs font-semibold text-neutral-900 dark:text-white line-clamp-2 min-h-[2.4em] group-hover:text-[#1e6fff]">
        {app.name}
      </span>
      <span className="text-[11px] text-neutral-500">{app.price || "Free"}</span>
      <Stars rating={app.rating} />
    </Link>
  );
}

export function MarketplaceStore() {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [featured, setFeatured] = useState<AppItem[]>([]);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All Categories"]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [sort, setSort] = useState<"popular" | "new">("popular");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = status?.apiBaseUrl || "http://127.0.0.1:8000";
  const storeUrl = status?.storeUrl || "http://127.0.0.1:5011";

  const load = useCallback(async (opts?: { refresh?: boolean }) => {
    setError(null);
    try {
      const stRes = await fetch("/api/marketplace/status");
      const st = await stRes.json();
      setStatus(st);

      if (!st.featureEnabled) {
        setError("Marketplace is disabled by feature flag.");
        setFeatured([]);
        setApps([]);
        return;
      }

      const catRes = await fetch("/api/marketplace/categories");
      if (catRes.ok) {
        const catData = await catRes.json();
        const list = catData.categories || [];
        setCategories(list.length ? list : ["All Categories"]);
      }

      const catParam =
        category && category !== "All Categories" ? category : undefined;
      const refreshQ = opts?.refresh ? "&refresh=1" : "";

      const [featRes, listRes] = await Promise.all([
        fetch(
          `/api/marketplace/apps?featured=1&sort=popular&limit=12${refreshQ}`
        ),
        fetch(
          `/api/marketplace/apps?sort=${sort}&limit=48${
            query ? `&q=${encodeURIComponent(query)}` : ""
          }${catParam ? `&category=${encodeURIComponent(catParam)}` : ""}${refreshQ}`
        ),
      ]);

      if (!listRes.ok) {
        const body = await listRes.json().catch(() => ({}));
        throw new Error(body.error || "Marketplace unavailable");
      }

      const listData = await listRes.json();
      setApps(listData.apps || []);

      if (featRes.ok) {
        const featData = await featRes.json();
        setFeatured((featData.apps || []).filter((a: AppItem) => a.featured));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load marketplace");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, query, sort]);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const csrf =
        document.cookie
          .split("; ")
          .find((c) => c.startsWith("neuriy_csrf="))
          ?.split("=")[1] || "";
      await fetch("/api/marketplace/refresh", {
        method: "POST",
        headers: { "x-csrf-token": csrf },
      });
    } catch {
      /* ignore */
    }
    await load({ refresh: true });
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    void load();
  };

  const connectionLabel = useMemo(() => {
    const c = status?.connection || "down";
    if (c === "connected") return "Connected";
    if (c === "degraded") return "Degraded";
    if (c === "disabled") return "Disabled";
    return "Offline";
  }, [status?.connection]);

  return (
    <div className="mp-page max-w-5xl w-full mx-auto px-4 pb-16 pt-4 animate-fade-in">
      <section className="mp-hero rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#1c1c1e] p-6 sm:p-8 mb-6 overflow-hidden relative">
        <div className="relative z-10 max-w-xl space-y-3">
          <p className="text-xs font-semibold tracking-wide uppercase text-[#1e6fff]">
            Neuriy Marketplace
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            Apps and tools for Neuriy AI
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Browse featured assistants, open installs from Neuriy Chat, and publish
            your own packages. After a developer uploads a tool and it is approved,
            ElloFive can search and use it via Marketplace tools.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href="#featured"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e6fff] text-white text-xs font-semibold hover:opacity-95"
            >
              <Store className="w-3.5 h-3.5" />
              Explore featured
            </a>
            <a
              href={`${storeUrl}/Apps/Upload`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload your app
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Sync catalog
            </button>
          </div>
          <p className="text-[11px] text-neutral-500 flex items-center gap-2 pt-1">
            <Bot className="w-3.5 h-3.5" />
            API {connectionLabel}
            {status?.aiToolsEnabled ? " · AI tools on" : " · AI tools off"}
          </p>
        </div>
        <div
          className="pointer-events-none absolute -right-8 -top-8 w-48 h-48 rounded-full bg-[#e8f1ff] dark:bg-blue-950/30 blur-2xl"
          aria-hidden
        />
      </section>

      <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-2 mb-6">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Neuriy apps and tools…"
            className="w-full h-11 pl-10 pr-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1c1c1e] text-sm outline-none focus:border-[#1e6fff] focus:ring-2 focus:ring-[#b7d0ff]"
          />
        </label>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setLoading(true);
          }}
          className="h-11 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1c1c1e] text-sm"
          aria-label="Category"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-11 px-5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-semibold"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="mb-4 text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500 animate-pulse">Loading marketplace…</p>
      ) : (
        <>
          <section id="featured" className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Featured Apps
              </h2>
              <span className="text-[11px] text-neutral-500">
                {featured.length} featured
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {featured.length === 0 ? (
                <p className="text-xs text-neutral-500">No featured apps yet.</p>
              ) : (
                featured.map((app) => (
                  <AppTile key={app.id} app={app} apiBase={apiBase} />
                ))
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3 gap-3">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-200/60 dark:bg-neutral-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setSort("popular");
                    setLoading(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    sort === "popular"
                      ? "bg-white dark:bg-neutral-700 shadow-xs"
                      : "text-neutral-500"
                  }`}
                >
                  Popular
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSort("new");
                    setLoading(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    sort === "new"
                      ? "bg-white dark:bg-neutral-700 shadow-xs"
                      : "text-neutral-500"
                  }`}
                >
                  New
                </button>
              </div>
              <p className="text-[11px] text-neutral-500">{apps.length} apps</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {apps.length === 0 ? (
                <p className="text-xs text-neutral-500 col-span-full">
                  No Marketplace apps found.
                </p>
              ) : (
                apps.map((app) => (
                  <AppTile key={app.id} app={app} apiBase={apiBase} />
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
