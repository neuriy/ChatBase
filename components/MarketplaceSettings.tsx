"use client";

import React, { useCallback, useEffect, useState, startTransition } from "react";
import {
  RefreshCw,
  Search,
  Store,
  Wifi,
  WifiOff,
  AlertTriangle,
  Bot,
  Package,
} from "lucide-react";

type Connection = "connected" | "degraded" | "down" | "disabled";

type StatusPayload = {
  featureEnabled: boolean;
  aiToolsEnabled: boolean;
  connection: Connection;
  lastSuccessfulSync: string | null;
  error: string | null;
  cacheTtl?: Record<string, number>;
};

type AppItem = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  developer?: string;
  version?: string;
  status?: string;
  updated_at?: string;
};

const copy = {
  nl: {
    title: "Neuriy Marketplace",
    overview: "Overzicht",
    connection: "Verbindingsstatus",
    datasets: "Beschikbare apps / resources",
    search: "Zoeken…",
    detail: "Details",
    apiStatus: "API-/servicestatus",
    refresh: "Nu vernieuwen",
    refreshing: "Vernieuwen…",
    aiAccess: "AI-toegang",
    aiOn: "AI mag Marketplace-data gebruiken",
    aiOff: "AI-toolpad uitgeschakeld (feature flag)",
    empty: "Geen Marketplace-items gevonden.",
    errorDown: "Marketplace is momenteel niet bereikbaar.",
    errorDegraded: "Marketplace werkt beperkt (degraded).",
    disabled: "Marketplace-integratie staat uit (feature flag).",
    lastSync: "Laatste succesvolle sync",
    never: "Nog niet",
    selectHint: "Selecteer een item voor details.",
    connected: "Verbonden",
    degraded: "Beperkt",
    down: "Offline",
    flagOff: "Uitgeschakeld",
  },
};

function statusLabel(c: Connection) {
  const t = copy.nl;
  switch (c) {
    case "connected":
      return t.connected;
    case "degraded":
      return t.degraded;
    case "disabled":
      return t.flagOff;
    default:
      return t.down;
  }
}

export function MarketplaceSettingsPanel() {
  const t = copy.nl;
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AppItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    const res = await fetch("/api/marketplace/status");
    if (res.status === 401) throw new Error("session");
    const data = await res.json();
    setStatus(data);
    return data as StatusPayload;
  }, []);

  const loadApps = useCallback(async (q: string, refresh = false) => {
    setListError(null);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (refresh) params.set("refresh", "1");
    const res = await fetch(`/api/marketplace/apps?${params}`);
    if (res.status === 401) throw new Error("session");
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setApps([]);
      setListError(body.error || t.errorDown);
      return;
    }
    const data = await res.json();
    setApps(data.apps || []);
    if (!(data.apps || []).length) setListError(null);
  }, [t.errorDown]);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    try {
      const st = await loadStatus();
      if (st.featureEnabled && st.connection !== "disabled") {
        await loadApps("");
      }
    } catch {
      setStatus({
        featureEnabled: false,
        aiToolsEnabled: false,
        connection: "down",
        lastSuccessfulSync: null,
        error: t.errorDown,
      });
    } finally {
      setLoading(false);
    }
  }, [loadApps, loadStatus, t.errorDown]);

  useEffect(() => {
    startTransition(() => {
      void bootstrap();
    });
  }, [bootstrap]);

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
      await loadStatus();
      await loadApps(query, true);
    } catch {
      setListError(t.errorDown);
    } finally {
      setRefreshing(false);
    }
  };

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await loadApps(query);
  };

  const onSelect = async (app: AppItem) => {
    setSelected(app);
    try {
      const res = await fetch(`/api/marketplace/apps/${encodeURIComponent(app.id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.app) setSelected(data.app);
      }
    } catch {
      /* keep list item */
    }
  };

  const connection = status?.connection || "down";

  return (
    <div className="space-y-4">
      {/* Overview + connection */}
      <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-neutral-700 dark:text-neutral-200" />
            <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">
              {t.overview}
            </h4>
          </div>
          <button
            onClick={onRefresh}
            disabled={refreshing || connection === "disabled"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? t.refreshing : t.refresh}
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {connection === "connected" ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
          ) : connection === "degraded" ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-red-500" />
          )}
          <span className="font-medium">
            {t.connection}: {statusLabel(connection)}
          </span>
        </div>

        <p className="text-[11px] text-neutral-500">
          {t.lastSync}:{" "}
          {status?.lastSuccessfulSync
            ? new Date(status.lastSuccessfulSync).toLocaleString("nl-NL")
            : t.never}
        </p>

        {connection === "disabled" && (
          <p className="text-[11px] text-amber-700 dark:text-amber-400">
            {t.disabled}
          </p>
        )}
        {(connection === "down" || connection === "degraded") &&
          status?.error && (
            <p className="text-[11px] text-red-600 dark:text-red-400">
              {connection === "degraded" ? t.errorDegraded : t.errorDown}
            </p>
          )}
      </div>

      {/* AI access */}
      <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 flex items-start gap-3">
        <Bot className="w-4 h-4 mt-0.5 text-neutral-700 dark:text-neutral-200" />
        <div>
          <p className="text-xs font-semibold text-neutral-900 dark:text-white">
            {t.aiAccess}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">
            {status?.aiToolsEnabled ? t.aiOn : t.aiOff}
          </p>
        </div>
      </div>

      {/* API status */}
      <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 space-y-1">
        <p className="text-xs font-semibold text-neutral-900 dark:text-white">
          {t.apiStatus}
        </p>
        {loading ? (
          <p className="text-[11px] text-neutral-400 animate-pulse">Laden…</p>
        ) : (
          <p className="text-[11px] text-neutral-500 font-mono">
            feature={String(status?.featureEnabled)} · ai=
            {String(status?.aiToolsEnabled)} · {statusLabel(connection)}
          </p>
        )}
      </div>

      {/* Search + list */}
      <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 space-y-3">
        <p className="text-xs font-semibold text-neutral-900 dark:text-white">
          {t.datasets}
        </p>
        <form onSubmit={onSearch} className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800">
            <Search className="w-3.5 h-3.5 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search}
              className="flex-1 bg-transparent text-xs outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
          >
            Zoek
          </button>
        </form>

        {listError && (
          <p className="text-[11px] text-red-600 dark:text-red-400">{listError}</p>
        )}

        {!listError && !apps.length && !loading && (
          <p className="text-[11px] text-neutral-500">{t.empty}</p>
        )}

        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {apps.map((app) => (
            <li key={app.id}>
              <button
                onClick={() => onSelect(app)}
                className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-colors ${
                  selected?.id === app.id
                    ? "border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800"
                    : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Package className="w-3.5 h-3.5" />
                  {app.name}
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">
                  {app.description}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Detail */}
      <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 space-y-2">
        <p className="text-xs font-semibold text-neutral-900 dark:text-white">
          {t.detail}
        </p>
        {!selected ? (
          <p className="text-[11px] text-neutral-500">{t.selectHint}</p>
        ) : (
          <div className="text-[11px] text-neutral-600 dark:text-neutral-300 space-y-1">
            <p>
              <span className="font-semibold">{selected.name}</span> · v
              {selected.version || "—"}
            </p>
            <p>
              {selected.developer} · {selected.category} · {selected.status}
            </p>
            <p className="leading-relaxed">{selected.description}</p>
            <p className="font-mono text-neutral-400">id: {selected.id}</p>
          </div>
        )}
      </div>
    </div>
  );
}
