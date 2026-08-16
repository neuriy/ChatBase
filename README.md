# Neuriy ChatBase

Neuriy AI chat application (`chat.neuriy.com`) with **IDHook auth**, **ElloFive** generation, and **Neuriy Marketplace** integration.

## Neuriy AI = our ChatGPT

| Piece | Role |
|-------|------|
| **Neuriy ChatBase** | ChatGPT-style product UI |
| **ElloFive** | AI model (`ELLOFIVE_URL`, default bridge on `:3999`) |
| **IDHook** | Auth gate |
| **Neuriy-Marketplace** | Apps / tools catalog |
| **FRC7 patterns** | Flags, orchestration conventions |

See [docs/NEURIY_ELLOFIVE.md](docs/NEURIY_ELLOFIVE.md).

```bash
# ElloFive model bridge (required for chat)
node services/ellofive-bridge/server.mjs

# ChatBase
cp .env.example .env.local
npm install
npm run dev
```

## Integration docs

- [API contracts (discovered)](docs/API_CONTRACTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Environment / feature flags](docs/ENVIRONMENT.md)

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local Next.js |
| `npm run build` | Production build |
| `npm test` | Vitest (auth/cache/tools/injection) |
| `npm run lint` | ESLint |

## Feature flags

Marketplace + AI tools default **off** when `NODE_ENV=production`. Enable with:

```bash
FEATURE_MARKETPLACE=true
FEATURE_MARKETPLACE_AI_TOOLS=true
```
