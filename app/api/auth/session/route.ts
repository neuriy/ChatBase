import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyIdToken,
} from "@/lib/auth/server";
import { getOrCreateTraceId, logEvent } from "@/lib/observability/trace";
import { randomBytes } from "crypto";
import { withCors } from "@/lib/http/cors";

/**
 * Establish httpOnly session cookie from Firebase ID token (IDHook).
 * Also issues a CSRF cookie for cookie-authenticated mutations.
 * CORS-enabled so Frontend-cms can exchange an ID token when same-site cookies apply.
 */
export async function POST(req: Request) {
  const traceId = getOrCreateTraceId(req.headers);
  const respond = (res: NextResponse) => withCors(req, res) as NextResponse;
  try {
    const body = await req.json();
    const idToken = String(body.idToken || "");
    if (!idToken) {
      return respond(
        NextResponse.json(
          { error: "idToken required", code: "bad_request" },
          { status: 400, headers: { "x-trace-id": traceId } }
        )
      );
    }

    const user = await verifyIdToken(idToken);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, idToken, sessionCookieOptions(3600));
    const csrf = randomBytes(24).toString("hex");
    cookieStore.set(CSRF_COOKIE, csrf, {
      ...sessionCookieOptions(3600),
      httpOnly: false,
    });

    logEvent("info", "auth.session_created", {
      traceId,
      uid: user.uid,
    });

    return respond(
      NextResponse.json(
        {
          ok: true,
          user: {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            role: user.role,
          },
          csrfToken: csrf,
        },
        { headers: { "x-trace-id": traceId } }
      )
    );
  } catch (err) {
    logEvent("warn", "auth.session_failed", {
      traceId,
      error: err instanceof Error ? err.message : "invalid",
    });
    return respond(
      NextResponse.json(
        {
          error: "Invalid credentials or token",
          code: "bad_credentials",
        },
        { status: 401, headers: { "x-trace-id": traceId } }
      )
    );
  }
}

export async function GET(req: Request) {
  const traceId = getOrCreateTraceId(req.headers);
  const respond = (res: NextResponse) => withCors(req, res) as NextResponse;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return respond(
      NextResponse.json(
        { authenticated: false },
        { status: 200, headers: { "x-trace-id": traceId } }
      )
    );
  }
  try {
    const user = await verifyIdToken(token);
    return respond(
      NextResponse.json(
        {
          authenticated: true,
          user: {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            role: user.role,
          },
        },
        { headers: { "x-trace-id": traceId } }
      )
    );
  } catch {
    return respond(
      NextResponse.json(
        { authenticated: false, code: "session_expired" },
        { status: 200, headers: { "x-trace-id": traceId } }
      )
    );
  }
}

export async function DELETE(req: Request) {
  const traceId = getOrCreateTraceId(req.headers);
  const respond = (res: NextResponse) => withCors(req, res) as NextResponse;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  cookieStore.set(CSRF_COOKIE, "", {
    ...sessionCookieOptions(0),
    httpOnly: false,
    maxAge: 0,
  });
  logEvent("info", "auth.session_cleared", { traceId });
  return respond(
    NextResponse.json({ ok: true }, { headers: { "x-trace-id": traceId } })
  );
}
