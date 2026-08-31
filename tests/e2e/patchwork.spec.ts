import { expect, test, type Page } from "@playwright/test";

const injectSiteTools = async (page: Page) => {
  await page.addInitScript(() => {
    const tools: Record<string, unknown> = {};
    Object.defineProperty(window, "__patchworkTools", {
      value: tools,
      configurable: true,
    });
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool(definition: { name: string }) {
          tools[definition.name] = definition;
          return Promise.resolve();
        },
      },
    });
  });
};

const invoke = async <T>(
  page: Page,
  name: string,
  input: Record<string, unknown>,
): Promise<T> =>
  page.evaluate(
    async ({ toolName, toolInput }) => {
      const definitions = (
        window as typeof window & {
          __patchworkTools: Record<
            string,
            { execute: (value: Record<string, unknown>) => Promise<unknown> }
          >;
        }
      ).__patchworkTools;
      return definitions[toolName].execute(toolInput);
    },
    { toolName: name, toolInput: input },
  ) as Promise<T>;

const waitForTools = async (page: Page) => {
  await page.waitForFunction(
    () =>
      Object.keys(
        (
          window as typeof window & {
            __patchworkTools: Record<string, unknown>;
          }
        ).__patchworkTools,
      ).length === 10,
  );
};

test.beforeEach(async ({ page }) => {
  await injectSiteTools(page);
});

test("loads the public-facing workspace without blocking console errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/?demo=landing");
  await waitForTools(page);
  await expect(page.locator("body")).toContainText("Relay");
  await expect(page.getByText("Preview ready", { exact: true })).toHaveText(
    "Preview ready",
    { timeout: 20_000 },
  );
  const preview = await invoke<{
    ok: boolean;
    revision: number;
    data: { status: string; renderedRevision?: number };
  }>(page, "inspect_preview", {});
  expect(preview.ok).toBe(true);
  expect(preview.data.status).toBe("ready");
  expect(preview.data.renderedRevision).toBe(preview.revision);
  expect(errors).toEqual([]);
});

test("loads every deterministic starter", async ({ page }) => {
  for (const [demo, name] of [
    ["landing", "Relay"],
    ["dashboard", "Canopy Metrics"],
    ["travel", "Wayfarer Daybook"],
  ] as const) {
    await page.goto(`/?demo=${demo}`);
    await waitForTools(page);
    await expect(page.locator("body")).toContainText(name);
    await expect(page.locator(".file-row")).toHaveCount(4);
  }
});

test("advertises ten ready WebMCP tools through the production adapter", async ({
  page,
}) => {
  await page.goto("/?demo=landing&fresh=1");
  await waitForTools(page);

  const toolStatus = page.locator(".tools-status");
  await expect(toolStatus).toBeVisible();
  await expect(toolStatus).toContainText("WebMCP");
  await expect(toolStatus).toContainText("10 tools ready");
  await expect(toolStatus).toHaveAttribute(
    "title",
    /ten structured WebMCP tools for Codex/i,
  );
  const registeredToolCount = await page.evaluate(
    () =>
      Object.keys(
        (
          window as typeof window & {
            __patchworkTools: Record<string, unknown>;
          }
        ).__patchworkTools,
      ).length,
  );
  expect(registeredToolCount).toBe(10);
});

test("fresh=1 reloads the exact starter without replacing normal saved work", async ({
  page,
}) => {
  await page.goto("/?demo=landing");
  await waitForTools(page);
  const normalContext = await invoke<{ revision: number }>(
    page,
    "get_workspace_context",
    {},
  );
  await invoke(page, "write_files", {
    writes: [
      {
        path: "src/App.tsx",
        content:
          "export default function App() { return <h1>Normal saved work</h1> }",
      },
    ],
    expectedRevision: normalContext.revision,
  });
  await expect(page.locator(".cm-content")).toContainText("Normal saved work");

  await page.goto("/?demo=landing&fresh=1");
  await waitForTools(page);
  await expect(page.locator(".cm-content")).toContainText("Relay");
  await expect(page.locator(".revision-pill")).toContainText("Revision 0");
  await expect(page.locator(".latest-event")).toHaveCount(0);
  const pristineFreshContext = await invoke<{
    revision: number;
    data: { lastCheckpoint: null | { id: string } };
  }>(page, "get_workspace_context", {});
  expect(pristineFreshContext.revision).toBe(0);
  expect(pristineFreshContext.data.lastCheckpoint).toBeNull();
  await invoke(page, "write_files", {
    writes: [
      {
        path: "src/App.tsx",
        content:
          "export default function App() { return <h1>Temporary fresh work</h1> }",
      },
    ],
    expectedRevision: 0,
  });
  await expect(page.locator(".cm-content")).toContainText(
    "Temporary fresh work",
  );

  await page.reload();
  await waitForTools(page);
  await expect(page.locator(".cm-content")).toContainText("Relay");
  await expect(page.locator(".revision-pill")).toContainText("Revision 0");

  await page.goto("/?demo=landing");
  await waitForTools(page);
  await expect(page.locator(".cm-content")).toContainText("Normal saved work");
  await expect(page.locator(".revision-pill")).toContainText("Revision 1");
});

test("shows an atomic WebMCP receipt and highlights the three changed files", async ({
  page,
}) => {
  await page.goto("/?demo=landing&fresh=1");
  await waitForTools(page);
  await expect(page.locator(".project-title")).toContainText("Relay");

  const before = await invoke<{ revision: number }>(
    page,
    "get_workspace_context",
    {},
  );
  const paths = ["src/App.tsx", "src/content.ts", "src/styles.css"];
  const read = await invoke<{
    ok: boolean;
    data: Array<{ path: string; content: string }>;
  }>(page, "read_files", { paths });
  expect(read.ok).toBe(true);

  const writes = read.data.map(({ path, content }) => ({
    path,
    content: path.endsWith(".css")
      ? `${content}\n/* Updated through WebMCP. */\n`
      : `${content}\n// Updated through WebMCP.\n`,
  }));
  const written = await invoke<{ ok: boolean; revision: number }>(
    page,
    "write_files",
    { writes, expectedRevision: before.revision },
  );
  expect(written.ok).toBe(true);
  expect(written.revision).toBe(1);

  const receipt = page.getByTestId("webmcp-receipt");
  await expect(receipt).toBeVisible();
  await expect(receipt).toContainText("WebMCP · write_files");
  await expect(receipt).toContainText("3 files updated atomically");
  await expect(receipt).toContainText("Revision 0 → 1");
  await expect(receipt).toContainText("Checkpoint saved");
  await expect(page.locator(".project-title")).toContainText(
    "Custom landing page",
  );

  const changedFiles = page.locator(".file-row.changed");
  await expect(changedFiles).toHaveCount(3);
  await expect(changedFiles.filter({ hasText: "App.tsx" })).toHaveCount(1);
  await expect(changedFiles.filter({ hasText: "content.ts" })).toHaveCount(1);
  await expect(changedFiles.filter({ hasText: "styles.css" })).toHaveCount(1);

  const after = await invoke<{
    revision: number;
    data: {
      lastCheckpoint: null | {
        kind: string;
        sourceRevision: number;
      };
    };
  }>(page, "get_workspace_context", {});
  expect(after.revision).toBe(1);
  expect(after.data.lastCheckpoint).toMatchObject({
    kind: "automatic",
    sourceRevision: 0,
  });
  const metadataOnly = await invoke<{ ok: boolean }>(
    page,
    "create_checkpoint",
    {
      label: "Receipt timer regression",
    },
  );
  expect(metadataOnly.ok).toBe(true);
  await expect(receipt).toBeHidden({ timeout: 7_500 });
  await expect(changedFiles).toHaveCount(0);
});

test("focuses the preview and exits focus with Escape", async ({ page }) => {
  await page.goto("/?demo=landing&fresh=1");
  await waitForTools(page);

  const mobileTabs = page.getByRole("navigation", {
    name: "Workspace views",
  });
  if (await mobileTabs.isVisible()) {
    await page.getByRole("button", { name: "Preview", exact: true }).click();
  }

  const focusButton = page.getByRole("button", { name: "Focus preview" });
  await expect(focusButton).toBeVisible();
  await focusButton.click();
  await expect(page.locator(".workspace-grid")).toHaveClass(/preview-focused/);
  await expect(
    page.getByRole("button", { name: "Exit preview focus" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("region", { name: "Live preview" }),
  ).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.locator(".workspace-grid")).not.toHaveClass(
    /preview-focused/,
  );
  await expect(
    page.getByRole("button", { name: "Focus preview" }),
  ).toHaveAttribute("aria-pressed", "false");
});

test("keeps the Patchwork mark visible at 820px", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1_000 });
  await page.goto("/?demo=landing&fresh=1");
  await waitForTools(page);

  const brandMark = page.locator(".brand-mark");
  await expect(brandMark).toBeVisible();
  const bounds = await brandMark.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds?.width).toBeGreaterThanOrEqual(27);
  expect(bounds?.height).toBeGreaterThanOrEqual(27);
});

test("uses the real registered handlers for read, atomic write, checkpoint and restore", async ({
  page,
}) => {
  await page.goto("/?demo=landing");
  await waitForTools(page);

  const context = await invoke<{ ok: boolean; revision: number }>(
    page,
    "get_workspace_context",
    {},
  );
  expect(context.ok).toBe(true);

  const read = await invoke<{ ok: boolean; data: Array<{ content: string }> }>(
    page,
    "read_files",
    {
      paths: ["src/App.tsx"],
    },
  );
  expect(read.ok).toBe(true);
  expect(read.data[0].content).toContain("Relay");

  const checkpoint = await invoke<{ ok: boolean; data: { id: string } }>(
    page,
    "create_checkpoint",
    {
      label: "Before Roamly",
    },
  );
  expect(checkpoint.ok).toBe(true);

  const updated = await invoke<{ ok: boolean; revision: number }>(
    page,
    "write_files",
    {
      writes: [
        {
          path: "src/App.tsx",
          content: `export default function App() { return (<main style={{ padding: 48, fontFamily: 'sans-serif' }}><h1>Roamly</h1><p>Travel, thoughtfully arranged.</p></main>); }`,
        },
      ],
      expectedRevision: context.revision,
    },
  );
  expect(updated.ok).toBe(true);
  await expect(page.locator(".revision-pill")).toContainText(
    `Revision ${updated.revision}`,
  );
  await expect(page.locator(".cm-content")).toContainText("Roamly");
  const previewHeading = page
    .frameLocator(".preview-frame iframe")
    .getByRole("heading", { name: "Roamly", exact: true });
  const immediatePreview = await invoke<{
    ok: boolean;
    revision: number;
    data: { status: string; renderedRevision?: number };
  }>(page, "inspect_preview", {});
  if (
    immediatePreview.data.status === "ready" &&
    immediatePreview.data.renderedRevision === updated.revision
  ) {
    await expect(previewHeading).toHaveCount(1);
  } else {
    expect(immediatePreview.data.renderedRevision).not.toBe(updated.revision);
  }
  const previewTab = page
    .locator(".mobile-tabs")
    .getByRole("button", { name: "Preview", exact: true });
  if (await previewTab.isVisible()) await previewTab.click();
  await expect(previewHeading).toBeVisible({ timeout: 20_000 });
  const renderedPreview = await invoke<{
    ok: boolean;
    revision: number;
    data: { status: string; renderedRevision?: number };
  }>(page, "inspect_preview", {});
  expect(renderedPreview.ok).toBe(true);
  expect(renderedPreview.data.status).toBe("ready");
  expect(renderedPreview.data.renderedRevision).toBe(updated.revision);
  await page.waitForTimeout(1_000);
  const stable = await invoke<{ ok: boolean; revision: number }>(
    page,
    "get_workspace_context",
    {},
  );
  expect(stable.ok).toBe(true);
  expect(stable.revision).toBe(updated.revision);

  const restored = await invoke<{ ok: boolean }>(page, "restore_checkpoint", {
    checkpointId: checkpoint.data.id,
    expectedRevision: updated.revision,
  });
  expect(restored.ok).toBe(true);
  const codeTab = page
    .locator(".mobile-tabs")
    .getByRole("button", { name: "Code", exact: true });
  if (await codeTab.isVisible()) await codeTab.click();
  await expect(page.locator(".cm-content")).toContainText("Relay");
  if (await previewTab.isVisible()) await previewTab.click();
  await expect(
    page.frameLocator(".preview-frame iframe").getByRole("heading", {
      name: "From first thought to clear direction.",
    }),
  ).toBeVisible();
});

test("edits a file manually through the visible code editor", async ({
  page,
}) => {
  await page.goto("/?demo=landing");
  await waitForTools(page);
  const editor = page.locator(".cm-content");
  await editor.click();
  await editor.press("Control+End");
  await editor.press("Enter");
  await editor.pressSequentially("// Manual edit works", { delay: 5 });
  await expect(editor).toContainText("Manual edit works");
  await expect(page.locator(".revision-pill")).toContainText("Revision 1", {
    timeout: 5_000,
  });
});

test("keeps the preview iframe least-privileged", async ({
  page,
}, testInfo) => {
  await page.goto("/?demo=landing");
  await waitForTools(page);
  if (testInfo.project.name === "tablet") {
    await page.getByRole("button", { name: "Preview", exact: true }).click();
  }
  const iframe = page.locator(".preview-frame iframe");
  await expect(iframe).toHaveAttribute(
    "sandbox",
    "allow-scripts allow-same-origin",
  );
  await expect(iframe).not.toHaveAttribute("allow", /.+/);
  await expect(page.getByText("Preview ready")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.locator(".preview-frame")).toHaveClass(/is-rendered/);
  await expect(page.locator(".sp-loading:visible")).toHaveCount(0);
  await expect(
    page
      .frameLocator(".preview-frame iframe")
      .getByRole("heading", { name: "From first thought to clear direction." }),
  ).toBeVisible();
});

test("shows an error introduced through Site Tools and clears it after repair", async ({
  page,
}, testInfo) => {
  await page.goto("/?demo=landing");
  await waitForTools(page);
  const initial = await invoke<{ revision: number }>(
    page,
    "get_workspace_context",
    {},
  );

  const invalidWrite = await invoke<{ ok: boolean; revision: number }>(
    page,
    "write_files",
    {
      writes: [
        { path: "src/App.tsx", content: "export default function App( {" },
      ],
      expectedRevision: initial.revision,
    },
  );
  expect(invalidWrite.ok).toBe(true);
  await expect(page.locator(".cm-content")).toContainText(
    "export default function App( {",
  );
  await expect(page.locator(".revision-pill")).toContainText(
    `Revision ${invalidWrite.revision}`,
  );
  if (testInfo.project.name === "tablet") {
    await page.getByRole("button", { name: "Preview", exact: true }).click();
  }
  await expect(page.getByText("Preview error")).toBeVisible({
    timeout: 20_000,
  });

  const broken = await invoke<{ data: { status: string; errors: unknown[] } }>(
    page,
    "inspect_preview",
    {},
  );
  expect(broken.data.status).toBe("error");
  expect(broken.data.errors.length).toBeGreaterThan(0);

  const current = await invoke<{ revision: number }>(
    page,
    "get_workspace_context",
    {},
  );
  await invoke(page, "write_files", {
    writes: [
      {
        path: "src/App.tsx",
        content:
          "export default function App() { return <h1>Fixed preview</h1> }",
      },
    ],
    expectedRevision: current.revision,
  });
  await expect(page.getByText("Preview ready")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("No issues")).toBeVisible();
});

test("resets exactly and exports a ZIP", async ({ page }) => {
  await page.goto("/?demo=landing");
  await waitForTools(page);
  const initial = await invoke<{ revision: number }>(
    page,
    "get_workspace_context",
    {},
  );
  await invoke(page, "write_files", {
    writes: [
      {
        path: "src/App.tsx",
        content: "export default function App() { return <h1>Temporary</h1> }",
      },
    ],
    expectedRevision: initial.revision,
  });
  await expect(page.locator(".cm-content")).toContainText("Temporary");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.locator(".cm-content")).toContainText("Relay");

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export ZIP/i }).click();
  expect((await download).suggestedFilename()).toBe("patchwork-landing.zip");
});

test("supports keyboard focus and tablet navigation", async ({
  page,
}, testInfo) => {
  await page.goto("/?demo=dashboard");
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => document.activeElement?.tagName);
  expect(["BUTTON", "A", "INPUT"]).toContain(focused);

  if (testInfo.project.name === "tablet") {
    await expect(
      page.getByRole("navigation", { name: "Workspace views" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    await expect(
      page.getByRole("region", { name: "Live preview" }),
    ).toBeVisible();
  }
});
