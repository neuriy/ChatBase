# Architecture — Neuriy ChatBase ↔ IDHook ↔ ElloFive ↔ Marketplace ↔ FRC7

```text
Browser
  │  @neuriy/auth (IDHook / Firebase)
  │  AuthGate → httpOnly neuriy_session cookie
  ▼
ChatBase (Next.js)
  ├── /api/auth/session          verify Firebase ID token (JWKS)
  ├── /api/marketplace/*         service layer v1 (cache, schema, sanitize)
  └── /api/chat                  tool loop → ElloFive /v1/chat
        │
        ├─► Neuriy-Marketplace   GET /health, /api/categories, /api/apps
        ├─► ElloFive             POST /v1/chat (generation)
        └─► FRC7 patterns        feature flags, marketplace client shape, tool loop
```

## Design choices forced by real APIs

1. **Marketplace is an apps catalog**, not datasets — tools are search/get/list/open.
2. **ElloFive has no tool calling** — ChatBase runs tools, then calls ElloFive with framed data.
3. **IDHook has no server session API** — ChatBase verifies Firebase ID tokens.
4. **No Marketplace ETag/webhooks** — ChatBase content-hash ETag + TTL + manual refresh.
5. **No hardcoded catalog fallback** (unlike FRC7 `LOCAL_CATALOG`) — degraded/error states only.

## Trace IDs

`x-trace-id` generated in `proxy.ts` / API handlers and forwarded to Marketplace + ElloFive fetches.

## Feature flags (kill switches)

| Env | Default | Effect |
|-----|---------|--------|
| `FEATURE_MARKETPLACE` | on in non-production | Settings + Marketplace API routes |
| `FEATURE_MARKETPLACE_AI_TOOLS` | on in non-production | Tool calls from `/api/chat` |

Set both to `false` / `0` without redeploying app code (config flip).

## Secrets rotation

| Secret | Rotation |
|--------|----------|
| Firebase web API key | Rotate in Firebase Console; update `NEXT_PUBLIC_FIREBASE_*` |
| `NEURIY_MARKETPLACE_TOKEN` | Re-issue via Marketplace login; update env; no code change |
| Session cookie | Bound to Firebase ID token lifetime (~1h); silent refresh via client |

Never commit secrets. Prefer a secret manager in production (FRC7 convention: env only today).

## Data handling (GDPR-minded)

- Log tool name/args/latency/outcome — never raw auth tokens.
- Marketplace query history is personal data; keep logs minimized.
- Chat history remains client-local unless a retention backend is added later.
