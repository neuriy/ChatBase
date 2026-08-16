/**
 * Server-side Firebase ID token verification (IDHook gap fill).
 * IDHook has no verify endpoint — we validate against Google JWKS for the project.
 */

import { createRemoteJWKSet, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/config/env";
import { logEvent } from "@/lib/observability/trace";

const SESSION_COOKIE = "neuriy_session";
const CSRF_COOKIE = "neuriy_csrf";

const jwks = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

export type AuthUser = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  role: string | null;
};

export async function verifyIdToken(idToken: string): Promise<AuthUser> {
  const projectId = env.firebaseProjectId;
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  const uid = String(payload.user_id || payload.sub || "");
  if (!uid) throw new Error("Invalid token: missing uid");

  return {
    uid,
    email: typeof payload.email === "string" ? payload.email : null,
    emailVerified: Boolean(payload.email_verified),
    // IDHook has no RBAC; Firebase custom claims may include role if set elsewhere
    role:
      typeof (payload as { role?: unknown }).role === "string"
        ? String((payload as { role?: string }).role)
        : null,
  };
}

export async function requireUser(
  req: Request
): Promise<{ user: AuthUser; token: string } | { error: Response }> {
  const authHeader = req.headers.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(SESSION_COOKIE)?.value || "";
  const token = bearer || cookieToken;

  if (!token) {
    return {
      error: Response.json(
        { error: "Unauthorized", code: "auth_required" },
        { status: 401 }
      ),
    };
  }

  try {
    const user = await verifyIdToken(token);
    return { user, token };
  } catch (err) {
    logEvent("warn", "auth.token_invalid", {
      error: err instanceof Error ? err.message : "invalid",
    });
    return {
      error: Response.json(
        {
          error: "Session expired",
          code: "session_expired",
          message: "Please sign in again.",
        },
        { status: 401 }
      ),
    };
  }
}

export function sessionCookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
  };
}

export { SESSION_COOKIE, CSRF_COOKIE };

/**
 * CSRF: double-submit cookie for cookie-based session mutations.
 * Bearer-token API calls from the SPA do not require CSRF.
 */
export function assertCsrf(req: Request, cookieStore: { get: (n: string) => { value: string } | undefined }) {
  const method = req.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return null;

  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) return null; // header auth ⇒ no CSRF needed

  const header = req.headers.get("x-csrf-token") || "";
  const cookie = cookieStore.get(CSRF_COOKIE)?.value || "";
  if (!header || !cookie || header !== cookie) {
    return Response.json(
      { error: "CSRF validation failed", code: "csrf" },
      { status: 403 }
    );
  }
  return null;
}
