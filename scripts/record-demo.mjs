import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const recordTarget = new URL(
  process.env.PATCHWORK_RECORD_URL ?? "https://patchwork-webmcp.vercel.app/",
);
recordTarget.searchParams.set("demo", "landing");
recordTarget.searchParams.set("fresh", "1");
const baseUrl = recordTarget.toString();
const outputDir = resolve("artifacts/video");
const rawVideoPath = resolve(outputDir, "patchwork-walkthrough-raw.webm");
const proofPath = resolve(outputDir, "patchwork-walkthrough-proof.json");

const canonicalPrompt =
  "Inspect the current project and turn it into a premium landing page for an AI travel assistant called Roamly. Keep it responsive, use a warm Indonesian travel aesthetic, add a clear hero, three feature cards and a strong call to action. Create a checkpoint before editing, inspect the preview afterward, fix any errors you find, then summarize the files you changed.";

const roamlyFiles = {
  "src/content.ts": `export const features = [
  { number: '01', icon: '✦', title: 'A plan that feels like you', text: 'Share your pace, tastes, and non-negotiables. Roamly shapes the route around what matters to you.' },
  { number: '02', icon: '⌁', title: 'Local texture, not tourist noise', text: 'Find quiet stays, neighborhood tables, and meaningful detours selected for the story you want to live.' },
  { number: '03', icon: '◌', title: 'Every detail, held lightly', text: 'Timing, transfers, and daily rhythm stay in one calm plan that adapts when your curiosity does.' },
];`,
  "src/App.tsx": `import { features } from './content';

export default function App() {
  return (
    <main className="roamly">
      <nav>
        <a className="brand" href="#top"><span>R</span>Roamly</a>
        <div className="navLinks"><a href="#features">How it works</a><a href="#journeys">Journeys</a></div>
        <button>Plan my escape</button>
      </nav>

      <section className="hero" id="top">
        <div className="heroCopy">
          <p className="eyebrow">Indonesia, thoughtfully planned</p>
          <h1>Go farther.<br />Feel <em>closer.</em></h1>
          <p className="lede">Roamly turns a few travel wishes into a soulful itinerary — balancing hidden places, unhurried days, and the details that make a journey yours.</p>
          <div className="actions"><button>Start your journey <span>↗</span></button><a href="#features">See how Roamly works</a></div>
          <p className="proof"><strong>4.9 from curious travelers</strong><br />Plans shaped around real rhythms, not checklists.</p>
        </div>
        <div className="visual" aria-label="A sample journey through Bali">
          <i className="sun" /><i className="island one" /><i className="island two" />
          <article className="routeCard">
            <p>Your next chapter</p><h2>Seven slow days<br />across Bali</h2>
            <div><span>01</span><strong>Sidemen <small>Rice terraces · 2 nights</small></strong></div>
            <div><span>02</span><strong>Amed <small>Reef mornings · 3 nights</small></strong></div>
            <div><span>03</span><strong>Munduk <small>Waterfall trails · 2 nights</small></strong></div>
          </article>
          <div className="weather">☀ <strong>28°</strong><small>Best light at 5:48</small></div>
        </div>
      </section>

      <section className="features" id="features">
        <header><p className="eyebrow">Travel intelligence, human pace</p><h2>Less planning.<br />More presence.</h2></header>
        <div className="featureGrid">{features.map((item) => <article key={item.number}><span>{item.number}</span><i>{item.icon}</i><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      </section>

      <section className="journeys" id="journeys">
        <p className="eyebrow">Made for the way you wander</p><h2>Journeys with room to breathe.</h2>
        <div><article className="bromo"><small>East Java</small><h3>Bromo before dawn</h3><p>Volcanic stillness</p></article><article className="sidemen"><small>Bali</small><h3>Sidemen in green</h3><p>Slow village days</p></article><article className="komodo"><small>Flores</small><h3>Komodo by sea</h3><p>Wild island light</p></article></div>
      </section>

      <section className="cta"><p className="eyebrow">Your journey, already taking shape</p><h2>Tell us what moves you.<br />We’ll map the rest.</h2><button>Build my Roamly plan <span>↗</span></button></section>
    </main>
  );
}`,
  "src/styles.css": `:root{font-family:Inter,ui-sans-serif,system-ui;color:#20372f;background:#f5efe3}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f5efe3;color:#20372f}button,a{font:inherit}button{cursor:pointer}.roamly{min-height:100vh;overflow:hidden}.roamly nav{height:72px;display:flex;align-items:center;gap:40px;padding:0 5vw;border-bottom:1px solid #20372f22;background:#fbf6ec}.brand{display:flex;align-items:center;gap:10px;color:#20372f;text-decoration:none;font-size:20px;font-weight:800}.brand>span{display:grid;place-items:center;width:31px;height:31px;border-radius:50% 50% 44% 56%;background:#d96f4c;color:white;font-size:13px;transform:rotate(-8deg)}.navLinks{display:flex;gap:28px;margin-left:auto}.navLinks a,.actions a{color:#4d625a;text-decoration:none;font-size:13px}.roamly button{border:0;border-radius:99px;background:#20372f;color:white;padding:12px 19px}.hero{display:grid;grid-template-columns:1.12fr .88fr;min-height:610px;background:#fbf6ec}.heroCopy{display:flex;flex-direction:column;justify-content:center;padding:65px 5.5vw}.eyebrow{margin:0;color:#bb5b3e;font-size:10px;font-weight:750;letter-spacing:.16em;text-transform:uppercase}.hero h1{margin:20px 0 24px;font-size:clamp(58px,6.8vw,100px);line-height:.88;letter-spacing:-.07em}.hero h1 em{color:#d96f4c;font-style:normal}.lede{max-width:600px;margin:0;color:#5b6b63;font-size:17px;line-height:1.65}.actions{display:flex;align-items:center;gap:24px;margin-top:30px}.actions button,.cta button{padding:15px 22px}.proof{margin-top:35px;color:#718078;font-size:11px;line-height:1.55}.proof strong{color:#31483e}.visual{position:relative;min-height:610px;overflow:hidden;background:linear-gradient(155deg,#ecad78 0 27%,#d86b49 27% 48%,#254d42 48% 100%)}.sun{position:absolute;top:9%;right:11%;width:116px;height:116px;border-radius:50%;background:#f6d990;box-shadow:0 0 0 22px #f6d99020}.island{position:absolute;border-radius:50%;background:#173b34;filter:drop-shadow(0 18px 25px #152f2a66)}.island.one{right:-8%;bottom:5%;width:76%;height:29%;transform:rotate(-18deg)}.island.two{right:48%;bottom:23%;width:38%;height:13%;transform:rotate(18deg)}.routeCard{position:absolute;top:12%;left:8%;width:min(80%,370px);padding:24px;border:1px solid #fff6;border-radius:21px;background:#fbf5ebed;box-shadow:0 35px 80px #153c3244;backdrop-filter:blur(12px)}.routeCard>p{margin:0;color:#bb5b3e;font-size:9px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}.routeCard h2{margin:12px 0 20px;font-size:27px;line-height:1.08;letter-spacing:-.04em}.routeCard>div{display:flex;align-items:center;gap:13px;padding:11px 0;border-top:1px solid #20372f18}.routeCard div>span{display:grid;place-items:center;width:27px;height:27px;border-radius:50%;background:#e5d8c5;color:#7d5c47;font-size:9px}.routeCard strong{display:flex;flex:1;justify-content:space-between;font-size:12px}.routeCard small{color:#7a887f;font-size:9px;font-weight:500}.weather{position:absolute;right:7%;bottom:9%;display:flex;align-items:center;gap:9px;padding:11px 15px;border-radius:14px;background:#f7dda6;box-shadow:0 15px 35px #17372f44}.weather small{font-size:9px}.features,.journeys{padding:85px 5.5vw}.features header{display:flex;align-items:end;justify-content:space-between;margin-bottom:42px}.features h2,.journeys h2,.cta h2{margin:0;font-size:clamp(40px,4.5vw,66px);line-height:.95;letter-spacing:-.055em}.featureGrid{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #20372f33}.featureGrid article{padding:30px 30px 8px 0}.featureGrid article+article{padding-left:30px;border-left:1px solid #20372f33}.featureGrid article>span{color:#c86a4b;font-size:10px}.featureGrid i{display:grid;place-items:center;width:43px;height:43px;margin:30px 0 20px;border-radius:14px;background:#dce6df;color:#315a4c;font-style:normal}.featureGrid h3{margin:0 0 11px;font-size:19px}.featureGrid p{max-width:330px;margin:0;color:#687870;font-size:12px;line-height:1.7}.journeys{background:#20372f;color:#f7f0e5}.journeys>.eyebrow{color:#e99571}.journeys h2{max-width:720px;margin:16px 0 40px}.journeys>div{display:grid;grid-template-columns:1.1fr .9fr 1fr;gap:14px}.journeys article{min-height:260px;display:flex;flex-direction:column;justify-content:flex-end;padding:24px;border-radius:20px;box-shadow:inset 0 -150px 100px #142b25bb}.bromo{background:linear-gradient(155deg,#db9a70,#666d5c 52%,#243f37)}.sidemen{background:linear-gradient(155deg,#96ad78,#426a54 55%,#173b34)}.komodo{background:linear-gradient(155deg,#efbd83,#9b6b4d 48%,#315d62)}.journeys small{color:#f3c7a9;font-size:9px;letter-spacing:.15em;text-transform:uppercase}.journeys h3{margin:7px 0 4px;font-size:25px}.journeys article p{margin:0;color:#d7dfd8;font-size:11px}.cta{text-align:center;padding:100px 24px;background:#e8c98d}.cta h2{margin:18px auto 28px}.cta button{margin:auto}@media(max-width:820px){.navLinks{display:none}.hero{grid-template-columns:1fr}.heroCopy{padding:65px 24px}.hero h1{font-size:58px}.visual{min-height:570px}.features,.journeys{padding:70px 24px}.features header{display:block}.features header .eyebrow{margin-bottom:16px}.featureGrid,.journeys>div{grid-template-columns:1fr}.featureGrid article+article{padding-left:0;border-left:0;border-top:1px solid #20372f33}}`,
};

const sleep = (ms) =>
  new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  recordVideo: { dir: outputDir, size: { width: 1920, height: 1080 } },
});

await context.addInitScript(() => {
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

const page = await context.newPage();
const video = page.video();
const consoleErrors = [];
const suppressedTelemetryRequests = [];
await page.route("https://col.csbops.io/**", async (route) => {
  suppressedTelemetryRequests.push(route.request().url());
  await route.fulfill({ status: 204, body: "" });
});
page.on("console", (message) => {
  if (message.type() === "error") {
    const location = message.location();
    consoleErrors.push(
      [message.text(), location.url].filter(Boolean).join(" · "),
    );
  }
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

const invoke = (name, input = {}) =>
  page.evaluate(
    async ({ toolName, toolInput }) =>
      window.__patchworkTools[toolName].execute(toolInput),
    { toolName: name, toolInput: input },
  );

const showCard = (kicker, title, detail, options = {}) =>
  page.evaluate(
    ({ cardKicker, cardTitle, cardDetail, full, accent }) => {
      let style = document.querySelector("#patchwork-recording-style");
      if (!style) {
        style = document.createElement("style");
        style.id = "patchwork-recording-style";
        style.textContent = `
          #patchwork-recording-card{position:fixed;z-index:2147483647;left:30px;bottom:28px;max-width:850px;padding:19px 23px;border:1px solid #ffffff30;border-radius:18px;background:#20372ff2;color:#fffdf9;box-shadow:0 24px 70px #14251f55;font-family:Inter,ui-sans-serif,system-ui;pointer-events:none;transition:opacity .35s ease,transform .35s ease}
          #patchwork-recording-card.full{inset:0;max-width:none;border:0;border-radius:0;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;background:linear-gradient(135deg,#f7f1e7f7,#e8c98df4);color:#20372f}
          #patchwork-recording-card .kicker{margin:0 0 8px;color:#f0b08f;font-size:14px;font-weight:800;letter-spacing:.15em;text-transform:uppercase}
          #patchwork-recording-card.full .kicker{color:#bb5b3e}
          #patchwork-recording-card h2{margin:0;font-size:36px;line-height:1.08;letter-spacing:-.035em}
          #patchwork-recording-card.full h2{max-width:1100px;font-size:78px}
          #patchwork-recording-card .detail{margin:10px 0 0;color:#dce8e1;font-size:18px;line-height:1.5;white-space:pre-line}
          #patchwork-recording-card.full .detail{max-width:1000px;color:#4e6259;font-size:24px}
          #patchwork-recording-card .accent{color:#f5c08f}
        `;
        document.head.append(style);
      }
      let card = document.querySelector("#patchwork-recording-card");
      if (!card) {
        card = document.createElement("section");
        card.id = "patchwork-recording-card";
        document.body.append(card);
      }
      card.className = full ? "full" : "";
      card.innerHTML = `<p class="kicker"></p><h2></h2><p class="detail"></p>`;
      card.querySelector(".kicker").textContent = cardKicker;
      card.querySelector("h2").textContent = cardTitle;
      card.querySelector(".detail").textContent = cardDetail;
      if (accent) card.querySelector("h2").classList.add("accent");
    },
    {
      cardKicker: kicker,
      cardTitle: title,
      cardDetail: detail,
      full: Boolean(options.full),
      accent: Boolean(options.accent),
    },
  );

const hideCard = () =>
  page.evaluate(() =>
    document.querySelector("#patchwork-recording-card")?.remove(),
  );

await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
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
await page.locator(".revision-pill").waitFor({ state: "attached" });

const startedAt = Date.now();
const waitUntil = async (seconds) => {
  const remaining = startedAt + seconds * 1000 - Date.now();
  if (remaining > 0) await sleep(remaining);
};

await showCard(
  "Patchwork · automated WebMCP walkthrough",
  "The page becomes the tool.",
  "No embedded chatbot · No API key · No separate MCP server\nSame registered handlers as the production integration",
);

await waitUntil(13.2);
await showCard(
  "One shared workspace",
  "Files, code and preview stay together.",
  "Local-first · React + TypeScript · IndexedDB · Checkpoints · ZIP export",
);
await page.locator(".file-row").filter({ hasText: "content.ts" }).click();
await waitUntil(17.2);
await page.locator(".file-row").filter({ hasText: "styles.css" }).click();
await waitUntil(21.2);
await page.locator(".file-row").filter({ hasText: "App.tsx" }).click();

await waitUntil(24.2);
await showCard(
  "10 top-level WebMCP tools",
  "Read precisely. Mutate atomically.",
  "get_workspace_context · list_files · read_files · write_files · move_file\ndelete_file · inspect_preview · create_checkpoint · restore_checkpoint · prepare_project_export",
);
const initialContext = await invoke("get_workspace_context");
if (initialContext.revision !== 0) {
  throw new Error(
    `Fresh demo must start at revision 0, observed ${initialContext.revision}.`,
  );
}
const fileList = await invoke("list_files");
const readResult = await invoke("read_files", {
  paths: ["src/App.tsx", "src/content.ts", "src/styles.css"],
});

await waitUntil(32.4);
await showCard(
  "Canonical mission",
  "“Inspect the current project…”",
  canonicalPrompt,
);

await waitUntil(39.7);
await showCard(
  "Bounded multi-file mutation",
  "Validate all → checkpoint → one revision → persist",
  "Expected revision: 0 · Three explicit text files · No partial write",
);
const manualCheckpoint = await invoke("create_checkpoint", {
  label: "Before Roamly demo",
});

await waitUntil(45.2);
await hideCard();
await waitUntil(46);
const writeResult = await invoke("write_files", {
  writes: Object.entries(roamlyFiles).map(([path, content]) => ({
    path,
    content,
  })),
  expectedRevision: initialContext.revision,
});
const mutationReceipt = page.getByTestId("webmcp-receipt");
await mutationReceipt.waitFor({ state: "visible", timeout: 5_000 });
const mutationReceiptText = (await mutationReceipt.innerText()).replace(
  /\s+/g,
  " ",
);
const normalizedMutationReceiptText = mutationReceiptText.toLowerCase();
for (const expected of [
  "webmcp · write_files",
  "3 files updated atomically",
  "revision 0 → 1",
  "checkpoint saved",
]) {
  if (!normalizedMutationReceiptText.includes(expected)) {
    throw new Error(`Mutation receipt is missing: ${expected}`);
  }
}
await page
  .getByText("Preview ready", { exact: true })
  .waitFor({ timeout: 30_000 });
await page.waitForFunction(() =>
  document.querySelector(".revision-pill")?.textContent?.includes("Revision 1"),
);
await page.locator(".cm-content").filter({ hasText: "Roamly" }).waitFor();
await page
  .frameLocator(".preview-frame iframe")
  .getByRole("heading", { name: /Go farther.*Feel closer/i })
  .waitFor({ timeout: 30_000 });

await waitUntil(55.5);
await showCard(
  "Atomic write complete",
  "Revision 0 → 1",
  "Checkpoint created automatically · src/App.tsx · src/content.ts · src/styles.css",
  { accent: true },
);

await waitUntil(61.5);
await hideCard();
const focusPreviewButton = page.getByRole("button", {
  name: "Focus preview",
  exact: true,
});
await focusPreviewButton.click();
await page.locator(".workspace-grid.preview-focused").waitFor({
  state: "visible",
  timeout: 5_000,
});
const previewFocusActivated = await page
  .getByRole("button", { name: "Exit preview focus", exact: true })
  .isVisible();
if (!previewFocusActivated) {
  throw new Error(
    "Focus preview did not activate for the transformed project.",
  );
}

await waitUntil(66.8);
const previewResult = await invoke("inspect_preview");
await showCard(
  "Honest diagnostics",
  "Preview ready · Revision 1",
  `${previewResult.data.errors.length} errors · ${previewResult.data.warnings.length} warnings\nCompiler and runtime signals only — no invented visual claim`,
);

await waitUntil(74.5);
const checkpointButton = page
  .getByRole("button", { name: /checkpoint/i })
  .first();
if (await checkpointButton.isVisible().catch(() => false))
  await checkpointButton.click();

await waitUntil(81.2);
await hideCard();
if (await checkpointButton.isVisible().catch(() => false))
  await checkpointButton.click();
const exitPreviewFocusButton = page.getByRole("button", {
  name: "Exit preview focus",
  exact: true,
});
if (await exitPreviewFocusButton.isVisible().catch(() => false))
  await exitPreviewFocusButton.click();
await page.locator(".workspace-grid:not(.preview-focused)").waitFor({
  state: "visible",
  timeout: 5_000,
});

await waitUntil(84.8);
await showCard(
  "Patchwork",
  "Build with Codex, directly inside the page.",
  "patchwork-webmcp.vercel.app\ngithub.com/Damso74/patchwork-webmcp\n\nIndependent project — not affiliated with or endorsed by OpenAI",
  { full: true },
);

await waitUntil(95.2);

const finalContext = await invoke("get_workspace_context");
if (consoleErrors.length > 0) {
  throw new Error(
    `Walkthrough emitted console errors:\n${consoleErrors.join("\n")}`,
  );
}
const proof = {
  generatedAt: new Date().toISOString(),
  label:
    "Automated Playwright walkthrough using the production page's registered handlers",
  adapter: "document.modelContext test adapter injected before page load",
  sourceUrl: baseUrl,
  canonicalPrompt,
  registeredToolCount: await page.evaluate(
    () => Object.keys(window.__patchworkTools ?? {}).length,
  ),
  initialContext,
  fileList,
  readResult: {
    ok: readResult.ok,
    revision: readResult.revision,
    files: readResult.data.map(({ path, sizeBytes }) => ({ path, sizeBytes })),
  },
  manualCheckpoint,
  writeResult,
  mutationReceiptText,
  previewFocusActivated,
  previewResult,
  finalContext,
  suppressedTelemetryRequests,
  consoleErrors,
};
await writeFile(proofPath, `${JSON.stringify(proof, null, 2)}\n`, "utf8");

await context.close();
if (!video) throw new Error("Playwright did not create a video artifact.");
await video.saveAs(rawVideoPath);
await browser.close();

console.log(JSON.stringify({ rawVideoPath, proofPath, proof }, null, 2));
