import { chromium } from "@playwright/test";
import { resolve } from "node:path";

const baseUrl = process.env.PATCHWORK_BASE_URL ?? "http://127.0.0.1:4176";
const captureTarget = new URL(baseUrl);
captureTarget.searchParams.set("demo", "landing");
captureTarget.searchParams.set("fresh", "1");
const output = resolve("public/patchwork-workspace.png");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

await page.addInitScript(() => {
  const tools = {};
  Object.defineProperty(window, "__patchworkTools", {
    value: tools,
    configurable: true,
  });
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: {
      registerTool(definition) {
        tools[definition.name] = definition;
        return Promise.resolve();
      },
    },
  });
});

await page.goto(captureTarget.toString(), { waitUntil: "domcontentloaded" });
await Promise.all([
  page.waitForFunction(
    () => Object.keys(window.__patchworkTools ?? {}).length === 10,
  ),
  page
    .locator(".tools-status.ready")
    .filter({ hasText: "10 tools ready" })
    .waitFor({ timeout: 30_000 }),
  page.getByText("Preview ready", { exact: true }).waitFor({ timeout: 30_000 }),
  page.locator(".preview-frame.is-rendered").waitFor({ timeout: 30_000 }),
  page
    .frameLocator(".preview-frame iframe")
    .getByRole("heading", {
      name: "From first thought to clear direction.",
    })
    .waitFor({ timeout: 30_000 }),
]);
await page.waitForTimeout(500);
await page.screenshot({ path: output, fullPage: true });
await browser.close();
console.log(`Workspace screenshot saved to ${output}`);
