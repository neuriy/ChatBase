/**
 * Kickstarter campaign capture — screenshots + video for investor upload pack.
 * Output → kickstarter/02-video + kickstarter/03-screenshots
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = path.resolve("kickstarter");
const SHOTS = path.join(ROOT, "03-screenshots");
const VIDEO = path.join(ROOT, "02-video");
const ART = "/opt/cursor/artifacts";
fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(VIDEO, { recursive: true });
fs.mkdirSync(ART, { recursive: true });

async function send(page, text) {
  const box = page.locator("textarea").first();
  await box.click();
  await box.fill("");
  await box.type(text, { delay: 12 });
  await box.press("Enter");
  await page.waitForTimeout(2000);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: ART, size: { width: 1280, height: 720 } },
});
await context.addCookies([
  {
    name: "neuriy_session",
    value: "dev:local-tester",
    domain: "127.0.0.1",
    path: "/",
  },
  {
    name: "neuriy_csrf",
    value: "dev-csrf",
    domain: "127.0.0.1",
    path: "/",
  },
]);
const page = await context.newPage();
page.setDefaultTimeout(45000);

await page.goto("http://127.0.0.1:3000", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1000);
await page.screenshot({ path: path.join(SHOTS, "01-home.png"), fullPage: true });

await send(page, "Who are you? Explain Neuriy AI and ElloFive.");
await page.waitForTimeout(1200);
await page.screenshot({
  path: path.join(SHOTS, "02-chat-ello5.png"),
  fullPage: true,
});

await send(page, "How does Ello5 learn automatically day and night?");
await page.waitForTimeout(1400);
await page.screenshot({
  path: path.join(SHOTS, "03-continuous-learning.png"),
  fullPage: true,
});

await page.goto("http://127.0.0.1:3000/marketplace", {
  waitUntil: "domcontentloaded",
});
await page.waitForTimeout(1800);
await page.screenshot({
  path: path.join(SHOTS, "04-marketplace.png"),
  fullPage: true,
});

await page.goto("http://127.0.0.1:3000/settings", {
  waitUntil: "domcontentloaded",
});
await page.waitForTimeout(1000);
await page.screenshot({
  path: path.join(SHOTS, "05-settings.png"),
  fullPage: true,
});

await page.goto("http://127.0.0.1:3000", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);
const face = page.getByTitle("Speak directly to AI Face");
if (await face.count()) {
  await face.click();
  await page.waitForTimeout(900);
  const kb = page.getByTitle("Type instead of speaking");
  if (await kb.count()) await kb.click();
  const input = page.getByPlaceholder("Type to Neuriy (ElloFive)…");
  if (await input.count()) {
    await input.fill("Pitch Neuriy for investors in one sentence.");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await page.waitForTimeout(2200);
  }
  await page.screenshot({
    path: path.join(SHOTS, "06-voice-ai-face.png"),
    fullPage: true,
  });
}

const videoHandle = page.video();
await context.close();
await browser.close();

if (videoHandle) {
  const raw = await videoHandle.path();
  const webm = path.join(VIDEO, "neuriy-kickstarter-demo.webm");
  fs.copyFileSync(raw, webm);
  fs.copyFileSync(raw, path.join(ART, "neuriy-kickstarter-demo.webm"));
  try {
    execSync(
      `ffmpeg -y -i "${webm}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${path.join(
        VIDEO,
        "neuriy-kickstarter-demo.mp4"
      )}"`,
      { stdio: "inherit" }
    );
    fs.copyFileSync(
      path.join(VIDEO, "neuriy-kickstarter-demo.mp4"),
      path.join(ART, "neuriy-kickstarter-demo.mp4")
    );
  } catch (err) {
    console.warn("ffmpeg mp4 convert skipped:", String(err?.message || err));
  }
  console.log("VIDEO", webm, fs.statSync(webm).size);
}

for (const f of fs.readdirSync(SHOTS)) {
  if (f.endsWith(".png")) {
    fs.copyFileSync(path.join(SHOTS, f), path.join(ART, `ks-${f}`));
  }
}
console.log("SHOTS", fs.readdirSync(SHOTS).join(", "));
