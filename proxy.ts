import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/http/cors";

/**
 * Next.js 16 proxy (formerly middleware).
 * Frontend AuthGate is UX-only — API routes enforce auth independently.
 * Proxy adds trace IDs, CORS for Frontend-cms, and blocks unauthenticated
 * access to protected API prefixes when no session cookie / bearer is present.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const traceId =
    request.headers.get("x-trace-id") ||
    request.headers.get("x-request-id") ||
    crypto.randomUUID();

  const corsApi =
    pathname.startsWith("/api/chat") ||
    pathname.startsWith("/api/marketplace") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/models") ||
    pathname.startsWith("/api/chain");

  if (request.method === "OPTIONS" && corsApi) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...corsHeaders(request),
        "x-trace-id": traceId,
      },
    });
  }

  const protectedApi =
    pathname.startsWith("/api/chat") ||
    pathname.startsWith("/api/marketplace") ||
    pathname.startsWith("/api/chain/vault");

  if (protectedApi) {
    const auth = request.headers.get("authorization");
    const session = request.cookies.get("neuriy_session")?.value;
    const bypass =
      process.env.DEV_AUTH_BYPASS === "1" &&
      process.env.NODE_ENV !== "production" &&
      (auth?.startsWith("Bearer dev:") || session?.startsWith("dev:"));
    if (!auth && !session && !bypass) {
      return NextResponse.json(
        { error: "Unauthorized", code: "auth_required" },
        {
          status: 401,
          headers: { "x-trace-id": traceId, ...corsHeaders(request) },
        }
      );
    }
  }

  const res = NextResponse.next();
  res.headers.set("x-trace-id", traceId);
  if (corsApi) {
    const cors = corsHeaders(request);
    for (const [k, v] of Object.entries(cors)) res.headers.set(k, String(v));
  }
  return res;
}

export const config = {
  matcher: [
    "/api/chat/:path*",
    "/api/marketplace/:path*",
    "/api/auth/:path*",
    "/api/health",
    "/api/models",
    "/api/learn",
    "/api/chain/:path*",
  ],
};
