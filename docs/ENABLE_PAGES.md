# Enable GitHub Pages (one-time)

The Kickstarter landing is already on `main` under `docs/` and on branch `gh-pages`.

This agent cannot flip the Pages switch (repo admin API returns 403). Do this once:

1. Open **https://github.com/neuriy/ChatBase/settings/pages**
2. **Build and deployment → Source**
   - Preferred: **GitHub Actions** (then re-run workflow *Deploy Kickstarter GitHub Pages*)
   - Or: **Deploy from a branch** → `gh-pages` / `/` (root)
3. Save and wait ~1 minute

Live URL: **https://neuriy.github.io/ChatBase/**
