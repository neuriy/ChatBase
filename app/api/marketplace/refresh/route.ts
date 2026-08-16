import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { assertCsrf, requireUser } from "@/lib/auth/server";
import { getOrCreateTraceId } from "@/lib/observability/trace";
import { refreshCache, getStatus } from "@/lib/marketplace/service";

/** Manual cache invalidation / refresh (Settings "Nu vernieuwen"). */
export async function POST(req: Request) {
  const traceId = getOrCreateTraceId(req.headers);
  const auth = await requireUser(req);
  if ("error" in auth) {
    return new NextResponse(auth.error.body, {
      status: auth.error.status,
      headers: { "x-trace-id": traceId, "content-type": "application/json" },
    });
  }

  const cookieStore = await cookies();
  const csrfFail = assertCsrf(req, cookieStore);
  if (csrfFail) {
    return new NextResponse(csrfFail.body, {
      status: csrfFail.status,
      headers: { "x-trace-id": traceId, "content-type": "application/json" },
    });
  }

  refreshCache();
  const status = await getStatus(traceId);
  return NextResponse.json(
    { ok: true, status },
    { headers: { "x-trace-id": traceId } }
  );
}
