import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { getOrCreateTraceId } from "@/lib/observability/trace";
import { getStatus } from "@/lib/marketplace/service";

export async function GET(req: Request) {
  const traceId = getOrCreateTraceId(req.headers);
  const auth = await requireUser(req);
  if ("error" in auth) {
    return new NextResponse(auth.error.body, {
      status: auth.error.status,
      headers: { "x-trace-id": traceId, "content-type": "application/json" },
    });
  }

  const status = await getStatus(traceId);
  return NextResponse.json(status, {
    headers: { "x-trace-id": traceId },
  });
}
