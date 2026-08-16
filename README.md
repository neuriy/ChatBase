# Neuriy ChatBase

Neuriy AI chat application (`chat.neuriy.com`) with **IDHook auth**, **ElloFive** generation, and **Neuriy Marketplace** integration.

## Quick start

```bash
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
