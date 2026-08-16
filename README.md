# Neuriy ChatBase

Neuriy AI chat application (`chat.neuriy.com`) — **our own ChatGPT**, powered by **ElloFive**.

## Demo (it works)

<video src="docs/demo/neuriy-demo.mp4" controls width="100%"></video>

[Download demo video (MP4)](docs/demo/neuriy-demo.mp4) · [WebM](docs/demo/neuriy-demo.webm) · [Desktop recording](docs/demo/neuriy-desktop-demo.mp4)

| Home | Chat (ElloFive) | HTML artifact |
|------|-----------------|---------------|
| ![Home](docs/demo/01-home.png) | ![Chat](docs/demo/02-chat-ellofive.png) | ![HTML](docs/demo/03-html-artifact.png) |

| SVG image | Marketplace answer | Settings · Marketplace |
|-----------|--------------------|------------------------|
| ![SVG](docs/demo/04-svg-image.png) | ![Marketplace](docs/demo/05-marketplace.png) | ![Settings](docs/demo/06-settings-marketplace.png) |

## Neuriy AI = our ChatGPT

```text
User → IDHook (auth) → Neuriy Chat UI → tools → ElloFive model → reply
```

| Piece | Role |
|-------|------|
| **Neuriy ChatBase** | ChatGPT-style product UI |
| **ElloFive** | AI model (`ELLOFIVE_URL`, bridge on `:3999`) |
| **IDHook** | Auth gate |
| **Neuriy-Marketplace** | Apps / tools catalog |
| **FRC7 patterns** | Flags, orchestration conventions |

See [docs/NEURIY_ELLOFIVE.md](docs/NEURIY_ELLOFIVE.md).

## Quick start

```bash
# 1) ElloFive model bridge (required)
npm run ellofive

# 2) Optional: Marketplace API on :8000
#    (from Neuriy-Marketplace) uvicorn main:app --port 8000

# 3) ChatBase
cp .env.example .env.local
# set NEXT_PUBLIC_DEV_AUTH_BYPASS=1 for local test login skip
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Capture a fresh demo

```bash
# servers must be running
npm run ellofive &
npm run dev &
node scripts/capture-demo.mjs   # writes docs/demo/*.png + neuriy-demo.webm/mp4
```

## Integration docs

- [API contracts (discovered)](docs/API_CONTRACTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Environment / feature flags](docs/ENVIRONMENT.md)
- [Neuriy + ElloFive](docs/NEURIY_ELLOFIVE.md)

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run ellofive` | ElloFive model bridge `:3999` |
| `npm run dev` | Local Next.js |
| `npm run build` | Production build |
| `npm test` | Vitest |
| `npm run ui:smoke` | Playwright UI smoke |
| `npm run lint` | ESLint |

## Feature flags

Marketplace + AI tools default **off** when `NODE_ENV=production`. Enable with:

```bash
FEATURE_MARKETPLACE=true
FEATURE_MARKETPLACE_AI_TOOLS=true
```
