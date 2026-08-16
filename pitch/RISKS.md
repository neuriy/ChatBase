# Risks and challenges

## Technical

- **GPU availability:** Continuous *knowledge* learning works on CPU. Full LoRA weight training needs a GPU droplet; we may phase GPU spend after stretch goals.
- **Model quality:** Early Ello5 may lag giant closed models on some tasks; continuous HF + chat feedback is designed to close the gap for Neuriy-specific workflows.
- **Marketplace moderation:** User-uploaded tools need review; bad packages will be blocked before AI tools can open them.
- **Auth / compliance:** IDHook/Firebase configuration must stay secure; we will not ship production with auth bypass enabled.

## Delivery

- Kickstarter rewards depend on beta stability. If launch slips, backers keep access windows and we communicate weekly.
- Self-hosting docs may need iteration for different DigitalOcean sizes.

## Market

- Competing assistants move fast. Our edge is **ownership**: brand, Marketplace, and a learning loop you can run 24/7.

## Mitigation

- Working demo already exists (this repo + video pack)
- Feature flags and auth gates reduce production risk
- Learning worker is restart-safe (`systemd`, cycle logs)
