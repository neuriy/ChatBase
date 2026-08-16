import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { getOrCreateTraceId } from "@/lib/observability/trace";
import {
  listCategories,
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

  try {
    const forceRefresh =
      new URL(req.url).searchParams.get("refresh") === "1";
    const result = await listCategories(traceId, { forceRefresh });
    return NextResponse.json(
      { categories: result.categories, cached: result.cached },
      {
        headers: {
          "x-trace-id": traceId,
          ETag: result.etag,
          "Cache-Control": "private, max-age=60",
        },
      }
    );
  } catch (err) {
    return mapError(err, traceId);
  }
}

function mapError(err: unknown, traceId: string) {
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
