/**
 * Environment + feature flags (FRC7-style kill switches via env).
 * Defaults: Marketplace integration OFF in production-like deploys.
 */

function bool(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (v == null || v === "") return fallback;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

function num(name: string, fallback: number): number {
  const v = process.env[name];
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Default OFF so production stays safe until explicitly enabled (Section 13). */
const defaultFlagsOn =
  process.env.NODE_ENV !== "production" ||
  process.env.FEATURE_FLAGS_DEFAULT === "on";

export const env = {
  marketplaceUrl: (
    process.env.NEURIY_MARKETPLACE_URL ||
    process.env.NEURIY_MARKETPLACE_LOCAL ||
    "http://127.0.0.1:8000"
  ).replace(/\/$/, ""),
  marketplaceStoreUrl: (
    process.env.NEURIY_MARKETPLACE_STORE_URL || "http://127.0.0.1:5011"
  ).replace(/\/$/, ""),
  marketplaceToken: process.env.NEURIY_MARKETPLACE_TOKEN || "",
  marketplaceTimeoutMs: num("NEURIY_MARKETPLACE_TIMEOUT_MS", 8000),

  ellofiveUrl: (process.env.ELLOFIVE_URL || "http://127.0.0.1:3999").replace(
    /\/$/,
    ""
  ),
  ellofiveModel: process.env.ELLOFIVE_MODEL || "ellofive",
  ellofiveTimeoutMs: num("ELLOFIVE_TIMEOUT_MS", 60000),
  /** Optional: real Ollama or upstream ElloFive — used by services/ellofive-bridge */
  ellofiveUpstream: process.env.ELLOFIVE_UPSTREAM || process.env.OLLAMA_HOST || "",

  firebaseProjectId:
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "neuriyart-com",
  firebaseApiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    "",
  firebaseAuthDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "neuriyart-com.firebaseapp.com",
  firebaseStorageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "neuriyart-com.firebasestorage.app",
  firebaseMessagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "762094443577",
  firebaseAppId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:762094443577:web:b1c16194dfe8280a3c41e8",

  nidLoginUrl: process.env.NEURIY_NID_URL || "https://id.neuriy.com",

  /**
   * ChatScan explorer (https://github.com/crypterchat/chatscan).
   * When unset, Neuriy uses a local CDCI-style commitment store.
   */
  chatscanUrl: (process.env.CHATSCAN_URL || "").replace(/\/$/, ""),
  chatscanIngestKey: process.env.CHATSCAN_INGEST_KEY || "",
  /**
   * Central DB / CHub API (https://github.com/Centraldb/chub).
   * Registers digests only — never message content.
   */
  centraldbUrl: (process.env.CENTRALDB_URL || "").replace(/\/$/, ""),
  centraldbApiKey: process.env.CENTRALDB_API_KEY || "",
  /** CDCI chain id used in ChatScan-style commitments. */
  chainId: process.env.NEURIY_CHAIN_ID || "neuriy-cdci-local",
  chainTimeoutMs: num("CHAIN_TIMEOUT_MS", 8000),

  /** Character budget for marketplace tool results injected into the model. */
  marketplaceContextBudgetChars: num("MARKETPLACE_CONTEXT_BUDGET_CHARS", 4000),
  marketplaceToolRateLimitPerMinute: num(
    "MARKETPLACE_TOOL_RATE_LIMIT_PER_MINUTE",
    30
  ),

  /** Cache TTLs (seconds) — documented per resource type. */
  cacheTtlListSec: num("MARKETPLACE_CACHE_TTL_LIST_SEC", 60),
  cacheTtlItemSec: num("MARKETPLACE_CACHE_TTL_ITEM_SEC", 120),
  cacheTtlCategoriesSec: num("MARKETPLACE_CACHE_TTL_CATEGORIES_SEC", 300),
  cacheTtlHealthSec: num("MARKETPLACE_CACHE_TTL_HEALTH_SEC", 30),

  flags: {
    marketplace: bool("FEATURE_MARKETPLACE", defaultFlagsOn),
    marketplaceAiTools: bool("FEATURE_MARKETPLACE_AI_TOOLS", defaultFlagsOn),
    /** Persist chat turns as CDCI/ChatScan commitments + Central DB hashes. */
    chainPersist: bool("FEATURE_CHAIN_PERSIST", defaultFlagsOn),
  },
} as const;

export type FeatureFlags = typeof env.flags;
