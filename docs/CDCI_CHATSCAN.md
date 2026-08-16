# Neuriy ↔ Central DB + CDCI + ChatScan

Neuriy ChatBase saves every chat turn using the same privacy model as
[ChatScan](https://github.com/crypterchat/chatscan):

```
encrypt locally → commit → anchor on CDCI → public metadata only
```

| Layer | Project | Role in Neuriy |
|-------|---------|----------------|
| Database / identity hashes | [Centraldb/chub](https://github.com/Centraldb/chub) | Register **content digests** (`POST /hash/create`) — never plaintext |
| Blockchain | [Centraldb/CDCI](https://github.com/Centraldb/CDCI) | X11 PoW chain; ChatScan-style `OP_RETURN` commitments (`CS1` + sha256d) |
| Explorer pattern | [crypterchat/chatscan](https://github.com/crypterchat/chatscan) | Public records addressed as `{HASH}/{ID}` with **content: PRIVATE** |

## What is public vs private

**Public** (`GET /api/chain/records`, `GET /api/chain/tx/{hash}/{id}`):

- ciphertext hash, size, protocol, channel hash, nonce
- CDCI commitment + anchor txid / block height
- Central DB hash / data ids
- Always `content: "PRIVATE"`

**Private** (never on the explorer):

- plaintext chat
- AES keys
- ciphertext envelopes

Owner-only decrypt: `GET /api/chain/vault` (IDHook auth required).

## Local mode (default)

When `CHATSCAN_URL` / `CENTRALDB_URL` are unset, Neuriy uses:

- `data/neuriy-chain/records.jsonl` — public metadata
- `data/neuriy-chain/vault/envelopes.jsonl` — private envelopes (server-side)
- Simulated CDCI-local anchors (`cdci-local` chain id)

## Production remotes

```bash
FEATURE_CHAIN_PERSIST=1
CHATSCAN_URL=https://chatscan.org          # or your ChatScan node
# CHATSCAN_INGEST_KEY=
CENTRALDB_URL=http://127.0.0.1:8788        # CHub / Central DB API
# CENTRALDB_API_KEY=cdb_live_…
# Point ChatScan at centraldatabased (CDCI) with -txindex=1 — see chatscan docs/CDCI.md
NEURIY_CHAIN_ID=main
```

Run CDCI core (`centraldatabased`) from the [CDCI](https://github.com/Centraldb/CDCI) repo; ChatScan indexes message commitments; CHub registers digests for developer verification.

## Flow inside ChatBase

1. User sends a message (IDHook required)
2. ElloFive replies via `/api/chat`
3. `persistChatTurn` seals `{user, assistant}` with AES-256-GCM
4. Derives ChatScan commitment for CDCI
5. Registers digest with Central DB (or local fallback)
6. Optionally submits metadata to ChatScan
7. Writes public record + private vault entry
8. Chat response includes `chain: { content: "PRIVATE", ref, commitment, anchor, … }` — never plaintext

## Vendored SDKs

- `vendor/chatscan-sdk` — from ChatScan SDK (MIT)
- `vendor/centraldb-sdk` — from CHub `@centraldb/sdk` (MIT)

Runtime code used by Next.js lives in `lib/chain/` (TypeScript ports matching those protocols).
