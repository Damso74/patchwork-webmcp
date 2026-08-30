import { chromium } from "@playwright/test";
import { resolve } from "node:path";

const baseUrl = process.env.PATCHWORK_BASE_URL ?? "http://127.0.0.1:4176";
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

await page.goto(`${baseUrl}/?demo=landing`, { waitUntil: "networkidle" });
await page.getByText("Site tools ready").waitFor();
await page.getByText("Preview ready").waitFor({ timeout: 30_000 });
await page.screenshot({ path: output, fullPage: true });
await browser.close();
console.log(`Workspace screenshot saved to ${output}`);
