"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  MessageSquare,
  Package,
  Star,
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
  updated_at?: string;
};

export function MarketplaceAppDetail({ appId }: { appId: string }) {
  const [app, setApp] = useState<AppItem | null>(null);
  const [apiBase, setApiBase] = useState("http://127.0.0.1:8000");
  const [storeUrl, setStoreUrl] = useState("http://127.0.0.1:5011");
  const [error, setError] = useState<string | null>(null);
  const [askHint, setAskHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const st = await fetch("/api/marketplace/status").then((r) => r.json());
        if (!cancelled) {
          if (st.apiBaseUrl) setApiBase(st.apiBaseUrl);
          if (st.storeUrl) setStoreUrl(st.storeUrl);
        }
        const res = await fetch(`/api/marketplace/apps/${encodeURIComponent(appId)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "App not found");
        if (!cancelled) setApp(data.app);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load app");
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [appId]);

  const icon =
    app?.icon_url &&
    (app.icon_url.startsWith("http")
      ? app.icon_url
      : `${apiBase.replace(/\/$/, "")}${app.icon_url}`);

  const askInChat = () => {
    const prompt = `Open marketplace app ${app?.name || appId} and tell me how to use it in Neuriy.`;
    sessionStorage.setItem("neuriy_pending_prompt", prompt);
    setAskHint("Opening chat…");
    window.location.href = "/";
  };

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/marketplace" className="text-sm text-[#1e6fff] inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-sm text-neutral-500 animate-pulse">
        Loading app…
      </div>
    );
  }

  const filled = Math.round(Math.min(5, Math.max(0, app.rating || 0)));

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-16 animate-fade-in">
      <Link
        href="/marketplace"
        className="text-sm text-[#1e6fff] inline-flex items-center gap-1 mb-5 font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Marketplace
      </Link>

      <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#1c1c1e] p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl bg-[#e8f1ff] dark:bg-blue-950/40 flex items-center justify-center overflow-hidden shrink-0">
            {icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={icon} alt="" className="w-16 h-16 object-contain" />
            ) : (
              <Package className="w-10 h-10 text-[#1e6fff]" />
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
              {app.name}
            </h1>
            <p className="text-sm text-neutral-500">
              {app.developer || "Community"} · {app.category || "Apps"} · v
              {app.version || "1.0.0"}
            </p>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="inline-flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < filled
                        ? "fill-[#1e6fff] text-[#1e6fff]"
                        : "text-neutral-300"
                    }`}
                  />
                ))}
              </span>
              <span>{(app.rating || 0).toFixed(1)}</span>
              <span>·</span>
              <span>{(app.downloads || 0).toLocaleString()} downloads</span>
              <span>·</span>
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {app.price || "Free"}
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
          {app.description}
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={askInChat}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e6fff] text-white text-xs font-semibold"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Use with Neuriy AI
          </button>
          <a
            href={`${apiBase}/api/apps/${encodeURIComponent(app.id)}/download`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            <Download className="w-3.5 h-3.5" />
            Download package
          </a>
          <a
            href={`${storeUrl}/Apps/Details/${encodeURIComponent(app.id)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Open on storefront
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {askHint && (
          <p className="text-xs text-neutral-500">{askHint}</p>
        )}

        <p className="text-[11px] text-neutral-400 font-mono">id: {app.id}</p>
      </div>
    </div>
  );
}
