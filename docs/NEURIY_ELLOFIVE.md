# Neuriy AI stack — our ChatGPT

```text
User
  ↓
IDHook Auth Gate          (identity)
  ↓
Neuriy ChatBase UI        (ChatGPT-style product)
  ↓
Chat orchestrator         (/api/chat)
  ├─ Marketplace tools    (Neuriy-Marketplace API)
  ├─ Product tools        (HTML / SVG / task / live)
  └─ ElloFive model       (ELLOFIVE_URL → /v1/chat)  ← the brain
        ↓
   Final Neuriy reply (+ artifacts)
```

| Piece | Role |
|-------|------|
| **Neuriy ChatBase** | Product / ChatGPT UX |
| **ElloFive (Ello5)** | AI model that writes answers |
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

Neuriy is the **assistant product**. ElloFive is the **model**. Together they are our own ChatGPT.
