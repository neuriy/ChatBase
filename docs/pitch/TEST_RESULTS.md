# Pre-Kickstarter test results

Date: 2026-08-16

## Automated

| Check | Result |
|-------|--------|
| `POST /api/chat` without login | `401 auth_required` |
| Chat + Ello5 (“How does Ello5 learn?”) | OK — continuous learning reply |
| `POST /v1/learn` feedback inbox | OK |
| Marketplace apps API | OK (apps returned) |
| Pages `/`, `/marketplace`, `/settings` | HTTP 200 |
| Vitest | **19/19 passed** |
| Kickstarter capture script | OK — 6 screenshots + MP4/WebM |

## Media produced

- `02-video/neuriy-kickstarter-demo.mp4` (~19s walkthrough)
- `02-video/neuriy-kickstarter-demo.webm`
- `03-screenshots/01` … `06`

## Notes for campaign

Record voiceover using `02-video/SCRIPT.md` if you want narration on top of the silent screen capture.
