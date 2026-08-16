import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { getOrCreateTraceId } from "@/lib/observability/trace";
import {
  searchApps,
  MarketplaceUnavailableError,
  MarketplaceHttpError,
} from "@/lib/marketplace/service";

export async function GET(req: Request) {
  const traceId = getOrCreateTraceId(req.headers);
  const auth = await requireUser(req);
  if ("error" in auth) {
    return new NextResponse(auth.error.body, {
      status: auth.error.status,
      headers: { "x-trace-id": traceId, "content-type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || undefined;
  const category = url.searchParams.get("category") || undefined;
  const sort = url.searchParams.get("sort") || undefined;
  const limit = Number(url.searchParams.get("limit") || "20");
  const forceRefresh = url.searchParams.get("refresh") === "1";
  const ifNoneMatch = req.headers.get("if-none-match");

  try {
    const result = await searchApps(
      traceId,
      { q, category, sort, limit },
      {
        forceRefresh,
        ifNoneMatch: ifNoneMatch || undefined,
        userBearer: auth.token,
      }
    );

    if (result.notModified) {
      return new NextResponse(null, {
        status: 304,
        headers: { "x-trace-id": traceId, ETag: result.etag },
      });
    }

    return NextResponse.json(
      { apps: result.apps, cached: result.cached ?? false },
      {
        headers: {
          "x-trace-id": traceId,
          ETag: result.etag,
          "Cache-Control": "private, max-age=60",
        },
      }
    );
  } catch (err) {
    if (err instanceof MarketplaceUnavailableError) {
      return NextResponse.json(
        { error: err.message, code: "marketplace_unavailable" },
        { status: 503, headers: { "x-trace-id": traceId } }
      );
    }
    if (err instanceof MarketplaceHttpError) {
      return NextResponse.json(
        { error: err.message, code: "marketplace_http" },
        { status: err.status, headers: { "x-trace-id": traceId } }
      );
    }
    return NextResponse.json(
      { error: "Invalid Marketplace response", code: "invalid_response" },
      { status: 502, headers: { "x-trace-id": traceId } }
    );
  }
}
