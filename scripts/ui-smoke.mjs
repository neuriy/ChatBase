import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function send(page, text) {
  const box = page.locator("textarea").first();
  await box.click();
  await box.fill("");
  await box.type(text, { delay: 5 });
  await box.press("Enter");
  await page.waitForTimeout(1200);
}

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(25000);

await page.goto("http://127.0.0.1:3000", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(out, "ui-01-home.png"), fullPage: true });

const body = await page.locator("body").innerText();
if (/Auth Gate/i.test(body) && !/What can I help/i.test(body)) {
  console.log("BLOCKED:", body.slice(0, 240));
  await browser.close();
  process.exit(2);
}
console.log("HOME_OK");

await send(page, "Hello who are you?");
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(out, "ui-02-hello.png"), fullPage: true });
console.log("HELLO:", (await page.locator("body").innerText()).includes("Neuriy"));

await send(page, "Make an HTML page for a Neuriy coffee shop");
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(out, "ui-03-html.png"), fullPage: true });
const afterHtml = await page.locator("body").innerText();
console.log("HTML:", /DOCTYPE html|Download HTML|HTML page/i.test(afterHtml));

await send(page, "Generate an image of a blue robot");
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(out, "ui-04-image.png"), fullPage: true });
const afterImg = await page.locator("body").innerText();
console.log("IMAGE:", /SVG|Download SVG|illustration/i.test(afterImg));

await page.locator('button[title="Neuriy User Profile & AI Settings"]').click();
await page.waitForTimeout(700);
await page.getByRole("button", { name: "Neuriy Marketplace" }).click();
await page.waitForTimeout(2500);
await page.screenshot({
  path: path.join(out, "ui-05-settings-marketplace.png"),
  fullPage: true,
});
const settingsText = await page.locator("body").innerText();
console.log(
  "MARKETPLACE_TAB:",
  /Neuriy Marketplace|Verbonden|Verbindingsstatus/i.test(settingsText)
);
console.log(
  "STATUS_SNIPPET:",
  settingsText.match(/Verbonden|Connected|Offline|Beperkt|Uitgeschakeld|Verbindingsstatus[^\n]*/i)?.[0] ||
    "n/a"
);

await browser.close();
console.log("DONE");
