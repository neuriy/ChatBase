# Neuriy AI — Own your assistant. Powered by ElloFive.

**Tagline:** Neuriy is not a rented assistant. **Neuriy** is your product — powered by **ElloFive (Ello5)** — and it can keep learning on infrastructure you control.

---

## The problem

Most people “rent” AI.

- Your chats sit on someone else’s cloud
- Your tools and plugins follow a closed store
- Model improvements are locked behind their roadmap
- Startups and teams cannot brand, host, or continuously train *their* assistant

Creators, schools, agencies, and product teams need an **ownable AI stack**: product UI + identity + marketplace + a model that improves overnight.

## The solution — Neuriy

**Neuriy** is an end-to-end AI product:

| Layer | What it is |
|-------|------------|
| **Neuriy ChatBase** | Beautiful chat product (web) — chat, voice, AI face |
| **ElloFive / Ello5** | Neuriy’s own AI model runtime |
| **IDHook (nID)** | Login required before AI use |
| **Neuriy Marketplace** | Apps & tools catalog — developers upload, AI can use |
| **Continuous learning** | DigitalOcean-ready worker + Hugging Face datasets, 24/7 |

No popups for Marketplace or Settings — they are **real pages inside the product**, same spirit as the Neuriy Marketplace storefront.

## What’s already built (working demo)

We are not pitching a slide deck only. The stack runs today:

1. **IDHook gate** — unauthenticated chat is rejected (`auth_required`)
2. **Ello5 replies** — Neuriy chat powered by ElloFive bridge
3. **Continuous learning** — HF datasets + thumbs-up chat feedback → knowledge bank Ello5 reloads automatically; optional LoRA when GPU is available
4. **Marketplace page** — featured / popular / new apps from the Marketplace API
5. **Settings page** — models, profile, privacy without modal clutter
6. **Voice + AI Face** — speak or type; Ello5 answers aloud
7. **Automated tests** — core vitest suite green on the build we ship

Screenshots and a walkthrough video are in this Kickstarter pack (`03-screenshots/`, `02-video/`).

## Why now

- Open models + Hugging Face datasets make continuous improvement practical
- Teams want branded assistants, not generic chat clones
- Marketplace economics: developers publish tools; Ello5 can discover and use them
- Always-on droplets (day & night) turn product usage into learning signal

## Who it’s for

- **Founders** shipping a branded AI assistant
- **Agencies** deploying client-specific Neuriy instances
- **Educators / communities** with their own tools catalog
- **Developers** uploading Marketplace packages Ello5 can call

## Roadmap (funded stretch)

| Phase | Outcome |
|-------|---------|
| **Now** | ChatBase + Ello5 bridge + Marketplace pages + learn worker (this demo) |
| **30 days** | Public beta, polished Kickstarter rewards fulfillment (early access) |
| **60 days** | GPU LoRA pipeline on DigitalOcean + Ollama promote automation |
| **90 days** | Multi-tenant workspaces, billing hooks, publisher payouts for Marketplace |
| **Stretch** | Mobile clients, enterprise SSO via IDHook, EU data residency guides |

## The ask

We are raising on Kickstarter to:

1. Keep **Ello5 learning 24/7** on production DigitalOcean capacity (CPU now, GPU stretch)
2. Finish **Marketplace developer UX** (upload → moderation → AI-usable tools)
3. Ship **stable public beta** of Neuriy Chat for backers
4. Produce clear docs so anyone can self-host the learning worker

See `USE_OF_FUNDS.md` and `04-rewards/REWARDS.md`.

## How continuous learning works (investor clarity)

```text
Hugging Face datasets ──┐
                        ├─► ello5-learn (systemd, day & night)
Neuriy 👍 chat feedback ┘         │
                                  ├─► knowledge bank → Ello5 answers improve
                                  └─► optional LoRA (GPU) → stronger model weights
```

Backers are funding a **product loop**, not a one-shot model download.

## Team note

Neuriy is built as an integrated stack across ChatBase, Marketplace, IDHook auth patterns, and ElloFive. This campaign packages the **working** ChatBase + Ello5 learning path for early believers.

## Call to action

**Back Neuriy.** Get early access, Marketplace publisher perks, and help us run Ello5 learning around the clock — so the assistant gets better while you sleep.

---

*Neuriy AI · powered by ElloFive (Ello5) · Marketplace · IDHook*
