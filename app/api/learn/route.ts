import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { getOrCreateTraceId } from "@/lib/observability/trace";
import { env } from "@/lib/config/env";
import { withCors } from "@/lib/http/cors";

/**
 * Forward liked / curated chat pairs into Ello5 continuous learning inbox.
 * The DigitalOcean worker merges these with Hugging Face datasets.
 */
export async function POST(req: Request) {
  const traceId = getOrCreateTraceId(req.headers);
  const respond = (res: NextResponse) => withCors(req, res) as NextResponse;

  const auth = await requireUser(req);
  if ("error" in auth) {
    return respond(
      new NextResponse(auth.error.body, {
        status: auth.error.status,
        headers: { "x-trace-id": traceId, "content-type": "application/json" },
      })
    );
  }

  try {
    const body = await req.json();
    const prompt = String(body.prompt || "").trim();
    const response = String(body.response || "").trim();
    if (!prompt || !response) {
      return respond(
        NextResponse.json(
          { error: "prompt and response required", code: "bad_request" },
          { status: 400, headers: { "x-trace-id": traceId } }
        )
      );
    }

    const learnUrl = `${env.ellofiveUrl}/v1/learn`;
    const upstream = await fetch(learnUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-trace-id": traceId },
      body: JSON.stringify({
        prompt,
        response,
        liked: body.liked !== false,
        source: "chat:neuriy",
        traceId,
      }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return respond(
        NextResponse.json(
          {
            error: data.error || "learn_upstream_failed",
            code: "learn_failed",
          },
          { status: 502, headers: { "x-trace-id": traceId } }
        )
      );
    }
    return respond(
      NextResponse.json(
        { ok: true, learning: data.learning || null },
        { headers: { "x-trace-id": traceId } }
      )
    );
  } catch (err) {
    return respond(
      NextResponse.json(
        {
          error: err instanceof Error ? err.message : "learn_error",
          code: "learn_error",
        },
        { status: 500, headers: { "x-trace-id": traceId } }
      )
    );
  }
}
