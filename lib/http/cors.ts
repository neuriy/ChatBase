/**
 * CORS for Neuriy Frontend-cms (and other allowed origins) calling ChatBase APIs
 * with IDHook Firebase Bearer tokens.
 */

const DEFAULT_ORIGINS = [
  "http://127.0.0.1:3001",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "https://neuriy.com",
  "https://www.neuriy.com",
  "https://art.neuriy.com",
  "https://chat.neuriy.com",
];

function allowedOrigins(): string[] {
  const fromEnv = (process.env.CHATBASE_CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([...DEFAULT_ORIGINS, ...fromEnv])];
}

export function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("origin") || "";
  const allowed = allowedOrigins();
  const ok = origin && allowed.includes(origin);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Authorization, Content-Type, X-Trace-Id, X-CSRF-Token",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (ok) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  return headers;
}

export function withCors(req: Request, res: Response): Response {
  const extra = corsHeaders(req);
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(extra)) headers.set(k, v);
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

export function corsPreflight(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
