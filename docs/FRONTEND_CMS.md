# IDHook auth + Frontend-cms → ChatBase

Neuriy AI requires **IDHook** login before any chat / ElloFive call.

```text
Frontend-cms (neuriy.com)          ChatBase (chat.neuriy.com)
  NeuriyAuth / IDHook Firebase  →  Authorization: Bearer <Firebase ID token>
  /chat-neuriy                  →  POST /api/chat  → ElloFive
```

## Auth rules

| Surface | Rule |
|---------|------|
| ChatBase UI | `AuthGate` — must sign in (IDHook / Firebase) |
| `POST /api/chat` | `requireUser` — session cookie **or** `Authorization: Bearer <idToken>` |
| Proxy | Rejects protected APIs with no auth header/cookie |
| `DEV_AUTH_BYPASS` | Local/dev only; never in production |

Firebase project (shared with Frontend-cms / IDHook): **`neuriyart-com`**.

## Frontend-cms connection

1. User signs in via `@neuriy/auth` (same Firebase / nID).
2. Frontend reads `user.getIdToken()` (or `@neuriy/auth` current user token).
3. `POST ${NEXT_PUBLIC_CHATBASE_URL}/api/chat` with:
   - `Authorization: Bearer <idToken>`
   - JSON body `{ messages, model, temperature }`
4. ChatBase CORS allows Frontend origins (`CHATBASE_CORS_ORIGINS` + defaults).

See [neuriy/Frontend-cms](https://github.com/neuriy/Frontend-cms) `src/app/chat-neuriy` and `src/lib/chatbase.ts`.

## Local smoke

```bash
# ChatBase
cp .env.example .env.local
# leave DEV_AUTH_BYPASS unset for real login; or set =1 only for automated tests
npm run ellofive
npm run dev   # :3000

# Frontend-cms (separate repo)
NEXT_PUBLIC_CHATBASE_URL=http://127.0.0.1:3000 npm run dev -- -p 3001
```
