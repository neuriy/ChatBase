import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js 16 proxy (formerly middleware).
 * Frontend AuthGate is UX-only — API routes enforce auth independently.
 * Proxy adds trace IDs and blocks unauthenticated access to protected API prefixes
 * when no session cookie / bearer is present (defense in depth).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const traceId =
    request.headers.get("x-trace-id") ||
    request.headers.get("x-request-id") ||
    crypto.randomUUID();

  const protectedApi =
    pathname.startsWith("/api/chat") ||
    pathname.startsWith("/api/marketplace");

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
          headers: { "x-trace-id": traceId },
        }
      );
    }
  }

  const res = NextResponse.next();
  res.headers.set("x-trace-id", traceId);
  return res;
}

export const config = {
  matcher: ["/api/chat/:path*", "/api/marketplace/:path*"],
};
