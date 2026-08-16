/**
 * Smoke: Marketplace + Settings are pages (not popups).
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addCookies([
  { name: "neuriy_session", value: "dev:local-tester", domain: "127.0.0.1", path: "/" },
  { name: "neuriy_csrf", value: "dev-csrf", domain: "127.0.0.1", path: "/" },
]);
const page = await context.newPage();
const failures = [];

try {
  await page.goto(`${BASE}/marketplace`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(800);
  const title = await page.getByText("Apps and tools for Neuriy AI").count();
  if (!title) failures.push("Marketplace hero missing");
  const featured = await page.getByText("Featured Apps").count();
  if (!featured) failures.push("Featured section missing");
  // Should not be a modal backdrop
  const modalish = await page.locator(".fixed.inset-0.z-50.bg-black\\/50").count();
  if (modalish) failures.push("Marketplace still looks like a modal popup");

  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(500);
  if (!(await page.getByText("Neuriy Settings").count())) {
    failures.push("Settings page title missing");
  }
  if (await page.locator(".fixed.inset-0.z-50.bg-black\\/50").count()) {
    failures.push("Settings still looks like a modal popup");
  }

  await page.screenshot({ path: "docs/demo/09-marketplace-page.png", fullPage: true });
  await page.goto(`${BASE}/marketplace`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: "docs/demo/09-marketplace-page.png", fullPage: true });
  await page.goto(`${BASE}/settings`);
  await page.waitForTimeout(400);
  await page.screenshot({ path: "docs/demo/10-settings-page.png", fullPage: true });
} catch (err) {
  failures.push(String(err?.message || err));
} finally {
  await browser.close();
}

if (failures.length) {
  console.error("PAGES SMOKE FAILED");
  failures.forEach((f) => console.error(" -", f));
  process.exit(1);
}
console.log("PAGES SMOKE OK");
