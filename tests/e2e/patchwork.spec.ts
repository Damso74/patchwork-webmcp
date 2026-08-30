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
  await expect(page.locator(".cm-content")).toContainText("Relay");
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
  expect((await download).suggestedFilename()).toMatch(/relay\.zip$/);
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
