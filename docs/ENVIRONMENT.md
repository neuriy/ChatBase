# Environment variables

Copy to `.env.local` for development.

```bash
# Feature flags (Section 13 — default OFF in production unless FEATURE_FLAGS_DEFAULT=on)
FEATURE_MARKETPLACE=true
FEATURE_MARKETPLACE_AI_TOOLS=true
# FEATURE_FLAGS_DEFAULT=on

# Neuriy Marketplace (actual API)
NEURIY_MARKETPLACE_URL=http://127.0.0.1:8000
NEURIY_MARKETPLACE_STORE_URL=http://127.0.0.1:5011
# NEURIY_MARKETPLACE_TOKEN=          # optional Bearer for privileged Marketplace calls
NEURIY_MARKETPLACE_TIMEOUT_MS=8000

# Cache TTLs (seconds)
MARKETPLACE_CACHE_TTL_LIST_SEC=60
MARKETPLACE_CACHE_TTL_ITEM_SEC=120
MARKETPLACE_CACHE_TTL_CATEGORIES_SEC=300
MARKETPLACE_CACHE_TTL_HEALTH_SEC=30

# AI tool budget / rate limit
MARKETPLACE_CONTEXT_BUDGET_CHARS=4000
MARKETPLACE_TOOL_RATE_LIMIT_PER_MINUTE=30

# ElloFive
ELLOFIVE_URL=http://127.0.0.1:3000
ELLOFIVE_MODEL=ellofive
ELLOFIVE_TIMEOUT_MS=60000

# IDHook / Firebase (public web config; restrict by domain in Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=robbieart-com.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=robbieart-com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=robbieart-com.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=762094443577
NEXT_PUBLIC_FIREBASE_APP_ID=

# Optional hosted login
NEURIY_NID_URL=https://id.neuriy.com
```

## Production rollout

1. Deploy with `FEATURE_MARKETPLACE=false` and `FEATURE_MARKETPLACE_AI_TOOLS=false`.
2. Enable for internal users by flipping flags.
3. Kill switch: set either flag to `false` — no redeploy required if env is hot-reloaded / restarted from config.
