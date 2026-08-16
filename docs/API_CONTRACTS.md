# API Contracts (discovered — not invented)

Written **before** integration code. Sources: cloned `Neuriy-Marketplace`, `IDHook`, `ElloFive`, `FRC7` (2026-08-16).

## Gaps vs. Integration Spec v2

| Spec assumption | Actual finding | Integration stance |
|-----------------|----------------|--------------------|
| Marketplace **datasets** + `get_dataset` / `query` tools | Marketplace API is an **apps catalog** only (`/api/apps`). No dataset entity. | Tools map to **apps**. Dataset tools are **not implemented**; flagged here. |
| IDHook JWT + refresh + CSRF + RBAC | IDHook is **Firebase client auth** (`@neuriy/auth`). No HTTP auth API, no CSRF (client Firebase), no RBAC, no refresh endpoint (Firebase rotates ID tokens). | Use `@neuriy/auth` + verify Firebase ID tokens server-side. No parallel auth system. |
| ElloFive native tool calling | ElloFive `POST /v1/chat` is prompt→text only (no tools/stream). | ChatBase **orchestrates** marketplace tools, then calls ElloFive with budgeted context. |
| Marketplace ETag / webhooks | Neither exists on Marketplace API. | Service layer implements **content-hash ETag** + TTL; invalidate on manual refresh / TTL. |
| FRC7 correlation IDs | Not present in FRC7. | ChatBase generates/propagates `x-trace-id`. |
| Hardcoded marketplace fallback (FRC7 `LOCAL_CATALOG`) | Spec forbids hardcoded Marketplace data. | On outage: **error/degraded** states — no fake catalog. |

---

## 1. Neuriy-Marketplace

**Base URL env:** `NEURIY_MARKETPLACE_URL` (default `http://127.0.0.1:8000`)  
**Storefront env:** `NEURIY_MARKETPLACE_STORE_URL` (default `http://127.0.0.1:5011`)  
**Optional service JWT:** `NEURIY_MARKETPLACE_TOKEN` → `Authorization: Bearer …`

### Endpoints used

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/health` | none | `{ status, service, database }` |
| `GET` | `/api/categories` | none | `{ categories: string[] }` |
| `GET` | `/api/apps` | none | Query: `q`, `category`, `featured`, `sort` (`popular`\|`new`), `status` |
| `GET` | `/api/apps/{id}` | none | Single app object |
| `GET` | `/api/apps/{id}/download` | none | Binary; 403 if not approved |

### App schema (serialized)

`id`, `name`, `description`, `category`, `developer`, `price`, `version`, `rating`, `downloads`, `featured`, `icon_url`, `package_filename`, `owner_id`, `status`, `moderation_score`, `moderation_notes`, `created_at`, `updated_at`

### Official Chat tools (Python SDK)

`marketplace_search`, `marketplace_get_app`, `marketplace_list_categories`, `marketplace_open_app`

---

## 2. IDHook (`@neuriy/auth`)

| Surface | Contract |
|---------|----------|
| Init | `initNeuriyAuth({ apiKey, authDomain, projectId, … })` |
| User | `{ uid, email, displayName, photoURL, emailVerified }` |
| Actions | `signInWithEmail`, `signInWithGoogle`, `signInWithYahoo`, `signOut`, `resetPassword`, `onUserChanged` |
| Hosted login | `redirectToNeuriyLogin('https://id.neuriy.com')` — **note:** login page currently ignores `?return=` |
| Server validation | **Not provided** — ChatBase verifies Firebase ID tokens via Google JWKS |

---

## 3. ElloFive

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/health` | — | liveness + models |
| `POST` | `/v1/chat` | `{ message \| prompt \| input, messages?, model? }` | `{ mode, model, output, message, status }` |

Env: `ELLOFIVE_URL` (default `http://127.0.0.1:3000`), `ELLOFIVE_MODEL` (default `ellofive`).

---

## 4. FRC7 (patterns reused)

- Marketplace client shape: `GET /api/apps` + `/health`
- Feature toggles via env (`FRC_ALLOW_BUILTIN`, etc.)
- Tool loop pattern in `packages/neuriy` (`detectToolIntent` → `runTool` → inject results)
- Auth model is **API keys** (`x-api-key`) — **not** used for ChatBase user auth (IDHook/Firebase is)

Env bridge: `NEURIY_MARKETPLACE_URL`, optional FRC gateway `FRC_URL` / `FRC_API_KEY` for future.
