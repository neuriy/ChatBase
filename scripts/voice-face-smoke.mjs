/**
 * Smoke-test AI Face + Voice Mode UI wiring.
 * Uses typed fallback (mic may be unavailable in headless).
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const outDir = path.resolve("docs/demo");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
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
    value: "dev-csrf-token",
    domain: "127.0.0.1",
    path: "/",
  },
]);
const page = await context.newPage();

const failures = [];

try {
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(800);

  // Home should show chat + AI face control
  const faceBtn = page.getByTitle("Speak directly to AI Face");
  if (!(await faceBtn.count())) {
    failures.push("AI Face button missing on chat input");
  } else {
    await faceBtn.click();
    await page.waitForTimeout(600);
  }

  const voiceTitle = page.getByText("Neuriy · ElloFive voice");
  if (!(await voiceTitle.count())) {
    failures.push("Voice mode overlay title missing");
  }

  // AI face SVG should be present
  const faceSvg = page.locator("svg").filter({ has: page.locator("rect") }).first();
  if (!(await faceSvg.count())) {
    failures.push("AI Face SVG missing in voice mode");
  }

  // Open typed fallback and send a message through ElloFive
  const keyboardBtn = page.getByTitle("Type instead of speaking");
  if (await keyboardBtn.count()) {
    await keyboardBtn.click();
  }
  const input = page.getByPlaceholder("Type to Neuriy (ElloFive)…");
  await input.waitFor({ timeout: 10000 });
  await input.fill("hi who are you");
  await page.getByRole("button", { name: "Send", exact: true }).click();

  // Wait for ElloFive reply text in the overlay
  await page.waitForFunction(
    () => {
      const body = document.body.innerText;
      return /Neuriy AI/i.test(body) && /ElloFive|Ello5/i.test(body);
    },
    { timeout: 30000 }
  );

  const body = await page.innerText("body");
  if (/ChatGPT/i.test(body)) {
    failures.push("Voice mode reply still mentions ChatGPT");
  }

  await page.screenshot({
    path: path.join(outDir, "07-voice-ai-face.png"),
    fullPage: true,
  });

  // Exit and verify chat has the same exchange
  await page.getByText("Exit Voice Mode").click();
  await page.waitForTimeout(500);
  const chat = await page.innerText("main");
  if (!/hi who are you/i.test(chat)) {
    failures.push("Voice exchange did not appear in main chat");
  }
  if (!/ElloFive|Ello5|Neuriy AI/i.test(chat)) {
    failures.push("ElloFive reply missing from main chat after voice mode");
  }

  await page.screenshot({
    path: path.join(outDir, "08-voice-chat-synced.png"),
    fullPage: true,
  });
} catch (err) {
  failures.push(String(err?.message || err));
  await page.screenshot({
    path: path.join(outDir, "07-voice-ai-face-error.png"),
    fullPage: true,
  }).catch(() => undefined);
} finally {
  await browser.close();
}

if (failures.length) {
  console.error("VOICE/FACE SMOKE FAILED:");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("VOICE/FACE SMOKE OK");
console.log("Wrote docs/demo/07-voice-ai-face.png and 08-voice-chat-synced.png");
