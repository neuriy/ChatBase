/**
 * Quick check: unauthenticated chat is rejected; CORS preflight allowed.
 */
const BASE = process.env.CHATBASE_URL || "http://127.0.0.1:3000";
const ORIGIN = process.env.FRONTEND_ORIGIN || "http://127.0.0.1:3001";

async function main() {
  const denied = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: ORIGIN,
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "hi" }],
    }),
  });
  const deniedBody = await denied.json().catch(() => ({}));
  if (denied.status !== 401) {
    throw new Error(`Expected 401 without auth, got ${denied.status}`);
  }
  if (deniedBody.code !== "auth_required" && deniedBody.code !== "session_expired") {
    // proxy may return auth_required; requireUser same
    console.warn("auth code:", deniedBody.code);
  }

  const preflight = await fetch(`${BASE}/api/chat`, {
    method: "OPTIONS",
    headers: {
      Origin: ORIGIN,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization,content-type",
    },
  });
  const allowOrigin = preflight.headers.get("access-control-allow-origin");
  if (preflight.status !== 204 && preflight.status !== 200) {
    throw new Error(`CORS preflight status ${preflight.status}`);
  }
  if (allowOrigin !== ORIGIN) {
    throw new Error(`CORS origin mismatch: ${allowOrigin}`);
  }

  console.log("AUTH+CORS OK — login required; Frontend-cms origin allowed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
