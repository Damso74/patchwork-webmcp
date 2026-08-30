import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
  ProjectPath,
  Revision,
  WorkspaceState,
} from "../../src/domain/workspace";
import {
  createWorkspaceFacade,
  type WorkspaceFacade,
} from "../../src/services/persistence";
import {
  createPatchworkTools,
  registerPatchworkTools,
  unregisterPatchworkToolsForTests,
  type ModelContextLike,
  type PreviewSnapshot,
  type WebMCPToolDefinition,
} from "../../src/webmcp";

const contentBytes = (content: string) =>
  new TextEncoder().encode(content).byteLength;

const makeWorkspace = (): WorkspaceState => {
  const now = "2026-08-30T12:00:00.000Z";
  const files = {
    "src/App.tsx": "export default function App() { return <h1>Relay</h1> }",
    "src/main.tsx": "import App from './App'; export default App",
    "src/styles.css": "body { color: #1d2621; }",
  };
  return {
    schemaVersion: 1,
    projectId: "webmcp-integration",
    starterId: "landing",
    revision: 0 as Revision,
    activePath: "src/App.tsx" as ProjectPath,
    files: Object.fromEntries(
      Object.entries(files).map(([path, content]) => [
        path,
        {
          path: path as ProjectPath,
          content,
          sizeBytes: contentBytes(content),
          updatedAt: now,
        },
      ]),
    ),
    createdAt: now,
    updatedAt: now,
  };
};

const preview: PreviewSnapshot = {
  status: "ready",
  errors: [],
  warnings: [],
  summary: "React preview compiled successfully.",
  renderedRevision: 0,
  renderedAt: "2026-08-30T12:00:01.000Z",
};

const toolsByName = (tools: WebMCPToolDefinition[]) =>
  new Map(tools.map((tool) => [tool.name, tool]));

describe("WebMCP integration", () => {
  let facade: WorkspaceFacade;
  let databaseName: string;

  beforeEach(async () => {
    databaseName = `patchwork-webmcp-test-${crypto.randomUUID()}`;
    facade = createWorkspaceFacade({
      initialWorkspace: makeWorkspace(),
      databaseName,
      now: () => "2026-08-30T12:00:02.000Z",
      newId: (() => {
        let id = 0;
        return () => `id-${++id}`;
      })(),
    });
    await facade.ready();
  });

  afterEach(async () => {
    unregisterPatchworkToolsForTests();
    facade.close();
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase(databaseName);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  });

  it("defines every required tool once with closed schemas and annotations", () => {
    const tools = createPatchworkTools({ facade, getPreview: () => preview });
    expect(tools.map((tool) => tool.name)).toEqual([
      "get_workspace_context",
      "list_files",
      "read_files",
      "write_files",
      "move_file",
      "delete_file",
      "inspect_preview",
      "create_checkpoint",
      "restore_checkpoint",
      "prepare_project_export",
    ]);
    expect(new Set(tools.map((tool) => tool.name)).size).toBe(tools.length);
    for (const tool of tools) {
      expect(tool.inputSchema.additionalProperties).toBe(false);
      expect(tool.description.length).toBeGreaterThan(30);
      expect(typeof tool.annotations.readOnlyHint).toBe("boolean");
    }
  });

  it("keeps all read tools side-effect free", async () => {
    const tools = toolsByName(
      createPatchworkTools({ facade, getPreview: () => preview }),
    );
    const before = facade.getState();
    const checkpointsBefore = await facade.listCheckpoints();
    const activityBefore = await facade.getActivities();

    await tools.get("get_workspace_context")?.execute({});
    await tools.get("list_files")?.execute({});
    await tools.get("read_files")?.execute({ paths: ["src/App.tsx"] });
    await tools.get("inspect_preview")?.execute({});
    await tools.get("prepare_project_export")?.execute({});

    expect(facade.getState()).toEqual(before);
    expect(await facade.listCheckpoints()).toEqual(checkpointsBefore);
    expect(await facade.getActivities()).toEqual(activityBefore);
  });

  it("writes a batch with one checkpoint and one revision", async () => {
    const tools = toolsByName(
      createPatchworkTools({ facade, getPreview: () => preview }),
    );
    const result = (await tools.get("write_files")?.execute({
      writes: [
        {
          path: "src/App.tsx",
          content: "export default function App() { return <h1>Roamly</h1> }",
        },
        { path: "src/theme.css", content: ":root { --warm: #d96f4c; }" },
      ],
      expectedRevision: 0,
    })) as { ok: boolean; revision: number };

    expect(result.ok).toBe(true);
    expect(result.revision).toBe(1);
    const checkpoints = await facade.listCheckpoints();
    expect(checkpoints.ok && checkpoints.value).toHaveLength(1);
    const activities = await facade.getActivities();
    expect(activities.ok && activities.value).toHaveLength(1);
  });

  it("does not change anything when one write is invalid", async () => {
    const tools = toolsByName(
      createPatchworkTools({ facade, getPreview: () => preview }),
    );
    const before = facade.getState();
    const result = (await tools.get("write_files")?.execute({
      writes: [
        { path: "src/App.tsx", content: "changed" },
        { path: "../escape.ts", content: "invalid" },
      ],
    })) as { ok: boolean };
    expect(result.ok).toBe(false);
    expect(facade.getState()).toEqual(before);
    const checkpoints = await facade.listCheckpoints();
    expect(checkpoints.ok && checkpoints.value).toHaveLength(0);
  });

  it("rejects dangerous move and delete paths", async () => {
    const tools = toolsByName(
      createPatchworkTools({ facade, getPreview: () => preview }),
    );
    const move = (await tools
      .get("move_file")
      ?.execute({ from: "src/App.tsx", to: "../App.tsx" })) as { ok: boolean };
    const remove = (await tools
      .get("delete_file")
      ?.execute({ path: "src/*" })) as { ok: boolean };
    expect(move.ok).toBe(false);
    expect(remove.ok).toBe(false);
    expect(Number(facade.getState().revision)).toBe(0);
  });

  it("reports preview diagnostics without claiming visual inspection", async () => {
    const errorPreview: PreviewSnapshot = {
      ...preview,
      status: "error",
      errors: [
        {
          severity: "error",
          path: "src/App.tsx",
          line: 3,
          message: "Unexpected token",
        },
      ],
      summary: "Compilation failed with 1 error.",
    };
    const tools = toolsByName(
      createPatchworkTools({ facade, getPreview: () => errorPreview }),
    );
    const result = (await tools.get("inspect_preview")?.execute({})) as {
      data: PreviewSnapshot;
    };
    expect(result.data).toEqual(errorPreview);
    expect(result.data.summary).not.toMatch(/looks|visual/i);
  });

  it("restores an explicit checkpoint exactly", async () => {
    const tools = toolsByName(
      createPatchworkTools({ facade, getPreview: () => preview }),
    );
    const checkpoint = (await tools
      .get("create_checkpoint")
      ?.execute({ label: "Before redesign" })) as {
      ok: boolean;
      data: { id: string };
    };
    expect(checkpoint.ok).toBe(true);
    expect(Object.keys(checkpoint.data).sort()).toEqual([
      "createdAt",
      "id",
      "kind",
      "label",
      "sourceRevision",
    ]);
    expect(JSON.stringify(checkpoint.data)).not.toMatch(
      /snapshot|files|content|projectId/,
    );
    await tools
      .get("write_files")
      ?.execute({ writes: [{ path: "src/App.tsx", content: "changed" }] });
    const restored = (await tools
      .get("restore_checkpoint")
      ?.execute({ checkpointId: checkpoint.data.id })) as { ok: boolean };
    expect(restored.ok).toBe(true);
    expect(facade.getState().files["src/App.tsx"].content).toContain("Relay");
  });

  it("rejects malformed optimistic revisions without side effects", async () => {
    const tools = toolsByName(
      createPatchworkTools({ facade, getPreview: () => preview }),
    );
    const checkpoint = (await tools
      .get("create_checkpoint")
      ?.execute({ label: "Safe baseline" })) as { data: { id: string } };
    const before = facade.getState();

    const calls = [
      [
        "write_files",
        {
          writes: [{ path: "src/App.tsx", content: "unsafe" }],
          expectedRevision: "0",
        },
      ],
      [
        "move_file",
        { from: "src/App.tsx", to: "src/Renamed.tsx", expectedRevision: null },
      ],
      ["delete_file", { path: "src/App.tsx", expectedRevision: -1 }],
      [
        "restore_checkpoint",
        { checkpointId: checkpoint.data.id, expectedRevision: 0.5 },
      ],
    ] as const;

    for (const [name, input] of calls) {
      const result = (await tools.get(name)?.execute(input)) as {
        ok: boolean;
        error: { code: string };
      };
      expect(result.ok).toBe(false);
      expect(result.error.code).toBe("INVALID_INPUT");
    }
    expect(facade.getState()).toEqual(before);
  });

  it("registers real handlers once and remains stable across hot reload calls", async () => {
    const captured: WebMCPToolDefinition[] = [];
    const modelContext: ModelContextLike = {
      registerTool: (definition) => {
        captured.push(definition);
      },
    };
    await registerPatchworkTools(facade, () => preview, modelContext);
    await registerPatchworkTools(facade, () => preview, modelContext);
    expect(captured).toHaveLength(10);
    const result = (await captured
      .find((tool) => tool.name === "read_files")
      ?.execute({ paths: ["src/App.tsx"] })) as { ok: boolean };
    expect(result.ok).toBe(true);
  });

  it("degrades cleanly without WebMCP", async () => {
    expect(await registerPatchworkTools(facade, () => preview, undefined)).toBe(
      "unavailable",
    );
    expect(facade.getState().files["src/App.tsx"]).toBeDefined();
  });
});
