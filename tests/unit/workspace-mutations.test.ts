import { describe, expect, it } from "vitest";
import { WORKSPACE_LIMITS } from "../../src/domain/workspace/limits";
import {
  createWorkspaceState,
  planWorkspaceMutation,
  snapshotWorkspace,
} from "../../src/domain/workspace/mutations";

const NOW = "2026-08-30T03:00:00.000Z";

const workspace = () => {
  const result = createWorkspaceState({
    projectId: "test-project",
    starterId: "landing",
    files: {
      "src/App.tsx":
        "export default function App() { return <main>Hello</main> }",
      "src/styles.css": "main { color: navy; }",
      "package.json": '{"scripts":{}}',
    },
    activePath: "src/App.tsx",
    now: NOW,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe("workspace mutations", () => {
  it("applies a valid write atomically with one revision", () => {
    const before = workspace();
    const beforeClone = structuredClone(before);
    const result = planWorkspaceMutation(
      before,
      {
        kind: "write",
        writes: [
          { path: "src/App.tsx", content: "updated" },
          { path: "src/Card.tsx", content: "new card" },
        ],
        expectedRevision: 0,
        origin: "webmcp",
      },
      { now: "2026-08-30T03:01:00.000Z", newId: () => "activity-1" },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.next.revision).toBe(1);
    expect(result.value.next.files["src/App.tsx"].content).toBe("updated");
    expect(result.value.next.files["src/Card.tsx"].content).toBe("new card");
    expect(result.value.beforeSnapshot).toEqual(snapshotWorkspace(before));
    expect(before).toEqual(beforeClone);
  });

  it("refuses a partially invalid batch without touching the input state", () => {
    const before = workspace();
    const beforeClone = structuredClone(before);
    const result = planWorkspaceMutation(
      before,
      {
        kind: "write",
        writes: [
          { path: "src/App.tsx", content: "would be valid" },
          { path: "../escape.ts", content: "invalid" },
        ],
        origin: "webmcp",
      },
      { now: NOW, newId: () => "unused" },
    );

    expect(result.ok).toBe(false);
    expect(before).toEqual(beforeClone);
  });

  it("enforces optimistic revisions", () => {
    const result = planWorkspaceMutation(
      workspace(),
      {
        kind: "delete",
        path: "src/styles.css",
        expectedRevision: 3,
        origin: "webmcp",
      },
      { now: NOW, newId: () => "unused" },
    );
    expect(result).toMatchObject({
      ok: false,
      error: { code: "REVISION_CONFLICT", currentRevision: 0 },
    });
  });

  it("measures file limits in UTF-8 bytes", () => {
    const result = planWorkspaceMutation(
      workspace(),
      {
        kind: "write",
        writes: [
          {
            path: "src/large.txt",
            content: "é".repeat(WORKSPACE_LIMITS.maxFileBytes / 2 + 1),
          },
        ],
        origin: "ui",
      },
      { now: NOW, newId: () => "unused" },
    );
    expect(result).toMatchObject({
      ok: false,
      error: { code: "FILE_TOO_LARGE" },
    });
  });

  it("restores snapshot content exactly while keeping revision monotonic", () => {
    const initial = workspace();
    const changed = planWorkspaceMutation(
      initial,
      {
        kind: "write",
        writes: [{ path: "src/App.tsx", content: "changed" }],
        origin: "ui",
      },
      { now: "2026-08-30T03:02:00.000Z", newId: () => "first" },
    );
    if (!changed.ok) throw new Error(changed.error.message);

    const restored = planWorkspaceMutation(
      changed.value.next,
      {
        kind: "restore",
        checkpointId: "checkpoint-1",
        snapshot: snapshotWorkspace(initial),
        expectedRevision: 1,
        origin: "ui",
      },
      { now: "2026-08-30T03:03:00.000Z", newId: () => "second" },
    );
    if (!restored.ok) throw new Error(restored.error.message);
    expect(restored.value.next.revision).toBe(2);
    expect(snapshotWorkspace(restored.value.next)).toEqual(
      snapshotWorkspace(initial),
    );
    expect(restored.value.checkpointKind).toBe("restore-safety");
  });
});
