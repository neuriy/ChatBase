import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { getOrCreateTraceId } from "@/lib/observability/trace";
import {
  getApp,
  MarketplaceUnavailableError,
  MarketplaceHttpError,
} from "@/lib/marketplace/service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const traceId = getOrCreateTraceId(req.headers);
  const auth = await requireUser(req);
  if ("error" in auth) {
    return new NextResponse(auth.error.body, {
      status: auth.error.status,
      headers: { "x-trace-id": traceId, "content-type": "application/json" },
    });
  }

  const { id } = await ctx.params;
  const forceRefresh =
    new URL(req.url).searchParams.get("refresh") === "1";
  const ifNoneMatch = req.headers.get("if-none-match");

  try {
    const result = await getApp(traceId, id, {
      forceRefresh,
      ifNoneMatch: ifNoneMatch || undefined,
      userBearer: auth.token,
    });

    if (result.notModified) {
      return new NextResponse(null, {
        status: 304,
        headers: { "x-trace-id": traceId, ETag: result.etag },
      });
    }

    return NextResponse.json(
      { app: result.app, cached: result.cached ?? false },
      {
        headers: {
          "x-trace-id": traceId,
          ETag: result.etag,
          "Cache-Control": "private, max-age=120",
        },
      }
    );
  } catch (err) {
    if (err instanceof MarketplaceHttpError && err.status === 404) {
      return NextResponse.json(
        { error: "Marketplace dataset/app not found", code: "not_found" },
        { status: 404, headers: { "x-trace-id": traceId } }
      );
    }
    if (err instanceof MarketplaceUnavailableError) {
      return NextResponse.json(
        { error: err.message, code: "marketplace_unavailable" },
        { status: 503, headers: { "x-trace-id": traceId } }
      );
    }
    return NextResponse.json(
      { error: "Invalid Marketplace response", code: "invalid_response" },
      { status: 502, headers: { "x-trace-id": traceId } }
    );
  }
}
