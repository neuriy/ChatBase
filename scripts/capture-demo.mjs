/**
 * Demo capture: screenshots + video proving Neuriy (ElloFive) chat works.
 * Output → docs/demo/
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT = path.resolve("docs/demo");
const ART = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(ART, { recursive: true });

async function send(page, text) {
  const box = page.locator("textarea").first();
  await box.click();
  await box.fill("");
  await box.type(text, { delay: 8 });
  await box.press("Enter");
  await page.waitForTimeout(1600);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: ART, size: { width: 1280, height: 800 } },
});
const page = await context.newPage();
page.setDefaultTimeout(30000);

await page.goto("http://127.0.0.1:3000", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
await page.screenshot({ path: path.join(OUT, "01-home.png"), fullPage: true });

await send(page, "Who are you? What powers Neuriy AI?");
await page.waitForTimeout(1200);
await page.screenshot({ path: path.join(OUT, "02-chat-ellofive.png"), fullPage: true });

await send(page, "Make an HTML page for Neuriy AI Studio");
await page.waitForTimeout(1800);
await page.screenshot({ path: path.join(OUT, "03-html-artifact.png"), fullPage: true });

await send(page, "Generate an image of a Neuriy aurora logo");
await page.waitForTimeout(1800);
await page.screenshot({ path: path.join(OUT, "04-svg-image.png"), fullPage: true });

await send(page, "Find a marketplace coding app");
await page.waitForTimeout(1600);
await page.screenshot({ path: path.join(OUT, "05-marketplace.png"), fullPage: true });

await page.locator('button[title="Neuriy User Profile & AI Settings"]').click();
await page.waitForTimeout(600);
await page.getByRole("button", { name: "Neuriy Marketplace" }).click();
await page.waitForTimeout(2200);
await page.screenshot({
  path: path.join(OUT, "06-settings-marketplace.png"),
  fullPage: true,
});

const video = page.video();
await context.close();
await browser.close();

if (video) {
  const raw = await video.path();
  const dest = path.join(OUT, "neuriy-demo.webm");
  fs.copyFileSync(raw, dest);
  // Also keep under artifacts for Walkthrough
  fs.copyFileSync(raw, path.join(ART, "neuriy-demo.webm"));
  // Copy screenshots to artifacts
  for (const f of fs.readdirSync(OUT)) {
    if (f.endsWith(".png")) {
      fs.copyFileSync(path.join(OUT, f), path.join(ART, f));
    }
  }
  console.log("VIDEO", dest, fs.statSync(dest).size);
}

console.log(
  "SHOTS",
  fs.readdirSync(OUT).filter((f) => f.endsWith(".png") || f.endsWith(".webm"))
);
