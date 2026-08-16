/**
 * ElloFive HTTP client — POST /v1/chat (actual contract).
 */

import { env } from "@/lib/config/env";
import { logEvent, withTraceHeaders } from "@/lib/observability/trace";

export class ElloFiveUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ElloFiveUnavailableError";
  }
}

export type ChatMessage = { role: string; content: string };

export async function ellofiveChat(opts: {
  traceId: string;
  messages: ChatMessage[];
  message?: string;
  model?: string;
  signal?: AbortSignal;
}): Promise<{ output: string; model: string; latencyMs: number }> {
  const started = Date.now();
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), env.ellofiveTimeoutMs);

  const onAbort = () => ctrl.abort();
  opts.signal?.addEventListener("abort", onAbort);

  try {
    const res = await fetch(`${env.ellofiveUrl}/v1/chat`, {
      method: "POST",
      headers: withTraceHeaders(opts.traceId, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        messages: opts.messages,
        message: opts.message,
        model: opts.model || env.ellofiveModel,
      }),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new ElloFiveUnavailableError(
        `ElloFive error ${res.status}: ${detail.slice(0, 200)}`
      );
    }

    const data = (await res.json()) as {
      output?: string;
      message?: { content?: string };
      model?: string;
      status?: string;
    };

    const output =
      data.output || data.message?.content || "";
    if (!output) {
      throw new ElloFiveUnavailableError("ElloFive returned empty output");
    }

    logEvent("info", "ellofive.chat_ok", {
      traceId: opts.traceId,
      latencyMs: Date.now() - started,
      model: data.model || env.ellofiveModel,
    });

    return {
      output,
      model: data.model || env.ellofiveModel,
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    if (err instanceof ElloFiveUnavailableError) throw err;
    const msg = err instanceof Error ? err.message : "unknown";
    logEvent("error", "ellofive.chat_failed", {
      traceId: opts.traceId,
      error: msg,
    });
    throw new ElloFiveUnavailableError(
      msg.includes("abort")
        ? "AI request timed out or was cancelled"
        : `ElloFive unavailable (${msg})`
    );
  } finally {
    clearTimeout(timeout);
    opts.signal?.removeEventListener("abort", onAbort);
  }
}

/** Local fallback when ElloFive is down — still attributes Marketplace sources. */
export function localFallbackReply(
  userPrompt: string,
  toolContext: string | null,
  marketplaceUnavailable: boolean
): string {
  const lines: string[] = [];
  if (marketplaceUnavailable) {
    lines.push(
      "Marketplace temporarily unavailable.",
      "",
      "The AI can still answer using its available knowledge, but Marketplace data could not be retrieved for this request."
    );
  }
  if (toolContext) {
    lines.push(
      "",
      "Based on Marketplace catalog data:",
      toolContext.slice(0, 1500),
      "",
      "(from Marketplace)"
    );
  } else {
    lines.push(
      "",
      `I received your request: "${userPrompt.slice(0, 200)}".`,
      "ElloFive is currently unreachable, so this is a degraded-mode reply."
    );
  }
  return lines.join("\n").trim();
}
