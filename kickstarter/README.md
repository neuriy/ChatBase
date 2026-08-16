# Neuriy Kickstarter — file map (upload pack)

**Live GitHub Pages:** https://neuriy.github.io/ChatBase/

Upload this folder’s contents to Kickstarter (Campaign → Story / Video / Images). The same media also ships on Pages under `docs/`.

```text
kickstarter/
├── README.md                      ← this map
├── 01-pitch/
│   ├── CAMPAIGN_TITLE.txt         ← project title (≤60 chars)
│   ├── SUBTITLE.txt               ← short blurb
│   ├── STORY.md                   ← full Kickstarter story (paste into Story)
│   ├── RISKS.md                   ← Risks and challenges
│   ├── USE_OF_FUNDS.md            ← budget breakdown
│   ├── INVESTOR_ONE_PAGER.md      ← short investor summary (EN)
│   └── INVESTOR_NL.md             ← investeerderstekst (NL)
├── 02-video/
│   ├── SCRIPT.md                  ← narration script for the video
│   ├── neuriy-kickstarter-demo.mp4
│   └── neuriy-kickstarter-demo.webm
├── 03-screenshots/
│   ├── 01-home.png
│   ├── 02-chat-ello5.png
│   ├── 03-continuous-learning.png
│   ├── 04-marketplace.png
│   ├── 05-settings.png
│   └── 06-voice-ai-face.png
├── 04-rewards/
│   └── REWARDS.md                 ← pledge tiers
├── 05-upload-checklist/
│   └── CHECKLIST.md               ← step-by-step Kickstarter upload
└── TEST_RESULTS.md                ← pre-pack smoke + vitest results
```

## Verified before packaging

- Auth required for AI (`auth_required` without login)
- Ello5 chat + continuous learning replies
- Marketplace API apps list
- `/`, `/marketplace`, `/settings` pages load
- 19 vitest tests passed

## Regenerate media

```bash
npm run ellofive &
npm run dev &
node scripts/capture-kickstarter.mjs
```
