# Neuriy AI stack — powered by ElloFive

```text
User
  ↓
IDHook Auth Gate          (identity)
  ↓
Neuriy ChatBase UI        (Neuriy chat product)
  ↓
Chat orchestrator         (/api/chat)
  ├─ Marketplace tools    (Neuriy-Marketplace API)
  ├─ Product tools        (HTML / SVG / task / live)
  └─ ElloFive (Ello5)     (ELLOFIVE_URL → /v1/chat)  ← Neuriy’s model
        ↓
   Final Neuriy reply (+ artifacts)
```

| Piece | Role |
|-------|------|
| **Neuriy ChatBase** | Neuriy chat product |
| **ElloFive (Ello5)** | Neuriy’s AI model that writes answers |
| **IDHook** | Login / session |
| **Neuriy-Marketplace** | Apps catalog tools |
| **FRC7 patterns** | Flags, tool loop, infra conventions |

## Run locally

```bash
# 1) Marketplace API (optional but recommended)
cd Neuriy-Marketplace/src/api && uvicorn main:app --port 8000

# 2) ElloFive bridge (Neuriy model gateway — ElloFive API contract)
node services/ellofive-bridge/server.mjs   # :3999

# 3) ChatBase
ELLOFIVE_URL=http://127.0.0.1:3999 npm run dev
```

Optional: set `ELLOFIVE_UPSTREAM=http://127.0.0.1:11434` (Ollama) or a real ElloFive host; the bridge prefers upstream and falls back to the Neuriy Ello5 brain.

## Mental model

**Neuriy** is the product. **ElloFive (Ello5)** is Neuriy’s own AI model. Replies come from Ello5 — not a third-party chat brand.
