/**
 * Marketplace tool contract — adapted to ACTUAL Neuriy-Marketplace SDK tools.
 *
 * Spec named marketplace.get_dataset / marketplace.query — those APIs do not exist.
 * Mapped tools (from Neuriy-Marketplace sdk/python/neuriy_marketplace/tools.py):
 *   marketplace.search  → marketplace_search
 *   marketplace.get_item → marketplace_get_app
 *   marketplace.list_categories → marketplace_list_categories
 *   marketplace.open_app → marketplace_open_app
 */

import { z } from "zod";
import { env } from "@/lib/config/env";
import { logEvent } from "@/lib/observability/trace";
import {
  getApp,
  listCategories,
  openApp,
  searchApps,
  toAiSearchResults,
  MarketplaceHttpError,
  MarketplaceUnavailableError,
} from "@/lib/marketplace/service";
import { frameAsUntrustedData } from "@/lib/marketplace/sanitize";
import { checkRateLimit } from "./rate-limit";

export const MARKETPLACE_TOOL_SPECS = [
  {
    name: "marketplace.search",
    description:
      "Search Neuriy Marketplace for AI apps and tools (not datasets — catalog is apps-only).",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        category: { type: "string" },
        limit: { type: "integer", minimum: 1, maximum: 20 },
      },
      required: ["query"],
    },
  },
  {
    name: "marketplace.get_item",
    description: "Get details for one Marketplace app by id.",
    parameters: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "marketplace.list_categories",
    description: "List Marketplace categories.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "marketplace.open_app",
    description:
      "Open a Marketplace app (returns deep links + chat card). Does not download binaries into the model.",
    parameters: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
] as const;

const SearchArgs = z.object({
  query: z.string().min(1).max(200),
  category: z.string().max(80).optional(),
  limit: z.number().int().min(1).max(20).optional(),
});

const IdArgs = z.object({
  id: z.string().min(1).max(80),
});

export type ToolCallResult = {
  name: string;
  ok: boolean;
  truncated?: boolean;
  data?: unknown;
  framed?: string;
  error?: string;
  latencyMs: number;
};

export async function executeMarketplaceTool(opts: {
  name: string;
  args: unknown;
  traceId: string;
  userId: string;
  userBearer?: string;
}): Promise<ToolCallResult> {
  const started = Date.now();
  const { name, args, traceId, userId, userBearer } = opts;

  if (!env.flags.marketplace || !env.flags.marketplaceAiTools) {
    return {
      name,
      ok: false,
      error: "Marketplace AI tools are disabled by feature flag",
      latencyMs: Date.now() - started,
    };
  }

  const rl = checkRateLimit(
    userId,
    env.marketplaceToolRateLimitPerMinute
  );
  if (!rl.ok) {
    logEvent("warn", "marketplace.tool_rate_limited", {
      traceId,
      userId,
      name,
    });
    return {
      name,
      ok: false,
      error: `Rate limit exceeded. Retry in ${rl.retryAfterSec}s`,
      latencyMs: Date.now() - started,
    };
  }

  try {
    let payload: unknown;
    switch (name) {
      case "marketplace.search":
      case "marketplace_search": {
        const a = SearchArgs.parse(args);
        const res = await searchApps(
          traceId,
          { q: a.query, category: a.category, limit: a.limit ?? 8 },
          { userBearer }
        );
        payload = toAiSearchResults(res.apps);
        break;
      }
      case "marketplace.get_item":
      case "marketplace_get_app": {
        const a = IdArgs.parse(args);
        const res = await getApp(traceId, a.id, { userBearer });
        payload = res.app;
        break;
      }
      case "marketplace.list_categories":
      case "marketplace_list_categories": {
        const res = await listCategories(traceId);
        payload = res.categories;
        break;
      }
      case "marketplace.open_app":
      case "marketplace_open_app": {
        const a = IdArgs.parse(args);
        payload = await openApp(traceId, a.id, userBearer);
        break;
      }
      case "marketplace.get_dataset":
      case "marketplace.query":
        return {
          name,
          ok: false,
          error:
            "Unsupported: Neuriy Marketplace has no dataset/query API (apps catalog only). See docs/API_CONTRACTS.md.",
          latencyMs: Date.now() - started,
        };
      default:
        return {
          name,
          ok: false,
          error: `Unknown tool: ${name}. Only marketplace.* tools are allowed.`,
          latencyMs: Date.now() - started,
        };
    }

    const { framed, truncated } = frameAsUntrustedData(
      name,
      payload,
      env.marketplaceContextBudgetChars
    );

    logEvent("info", "marketplace.tool_ok", {
      traceId,
      userId,
      name,
      latencyMs: Date.now() - started,
      truncated,
    });

    return {
      name,
      ok: true,
      data: payload,
      framed,
      truncated,
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? "Invalid tool arguments"
        : err instanceof MarketplaceHttpError
          ? err.status === 404
            ? "Marketplace item not found"
            : err.message
          : err instanceof MarketplaceUnavailableError
            ? err.message
            : "Marketplace tool failed";

    logEvent("error", "marketplace.tool_error", {
      traceId,
      userId,
      name,
      error: message,
      latencyMs: Date.now() - started,
    });

    return {
      name,
      ok: false,
      error: message,
      latencyMs: Date.now() - started,
    };
  }
}

/** Heuristic: should we call Marketplace for this user message? */
export function shouldUseMarketplace(text: string): boolean {
  const t = String(text || "").toLowerCase();
  if (!t.trim()) return false;
  return /\b(marketplace|neuriy\s+apps?|find\s+(an?\s+)?app|browse\s+apps|dataset|catalog|plugin|extension)\b/i.test(
    t
  );
}

export function detectMarketplaceToolCalls(
  text: string
): Array<{ name: string; args: Record<string, unknown> }> {
  if (!shouldUseMarketplace(text)) return [];
  const stop = new Set([
    "please",
    "can",
    "you",
    "could",
    "find",
    "search",
    "show",
    "browse",
    "look",
    "get",
    "list",
    "marketplace",
    "neuriy",
    "app",
    "apps",
    "dataset",
    "catalog",
    "for",
    "me",
    "a",
    "an",
    "the",
    "some",
    "any",
    "with",
    "that",
    "this",
    "help",
    "helper",
    "assistance",
  ]);
  const tokens = String(text)
    .toLowerCase()
    .replace(/[?!.,]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !stop.has(t));
  // Marketplace SQL LIKE matches the whole query as a substring — prefer a strong keyword
  const q = tokens[0] || "assistant";
  return [
    { name: "marketplace.search", args: { query: q.slice(0, 200), limit: 5 } },
  ];
}
