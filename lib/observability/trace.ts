import { randomUUID } from "crypto";

export const TRACE_HEADER = "x-trace-id";

export function getOrCreateTraceId(headers: Headers): string {
  const existing = headers.get(TRACE_HEADER) || headers.get("x-request-id");
  if (existing && /^[a-zA-Z0-9._-]{8,128}$/.test(existing)) return existing;
  return randomUUID();
}

export function withTraceHeaders(
  traceId: string,
  extra?: HeadersInit
): Record<string, string> {
  const base: Record<string, string> = {
    [TRACE_HEADER]: traceId,
    "x-request-id": traceId,
  };
  if (!extra) return base;
  const h = new Headers(extra);
  h.forEach((v, k) => {
    base[k] = v;
  });
  return base;
}

/** Structured log line — never log auth tokens. */
export function logEvent(
  level: "info" | "warn" | "error",
  event: string,
  fields: Record<string, unknown> = {}
) {
  const safe = { ...fields };
  for (const key of Object.keys(safe)) {
    if (/token|password|secret|authorization|cookie/i.test(key)) {
      safe[key] = "[redacted]";
    }
  }
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...safe,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
