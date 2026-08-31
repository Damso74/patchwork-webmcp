import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { WORKSPACE_LIMITS } from "../../src/domain/workspace/limits";
import {
  createWorkspaceState,
  snapshotWorkspace,
} from "../../src/domain/workspace/mutations";
import {
  deletePatchworkDatabase,
  openPatchworkDatabase,
} from "../../src/services/persistence/db";
import {
  createWorkspaceFacade,
  type WorkspaceFacade,
} from "../../src/services/persistence/workspaceFacade";

const openFacades: WorkspaceFacade[] = [];
const databaseNames: string[] = [];

const makeFacade = (databaseName: string): WorkspaceFacade => {
  const created = createWorkspaceState({
    projectId: "checkpoint-validation-project",
    starterId: "landing",
    files: {
      "src/App.tsx": "initial",
      "package.json": "{}",
    },
    activePath: "src/App.tsx",
    now: "2026-08-31T08:00:00.000Z",
  });
  if (!created.ok) throw new Error(created.error.message);

  let id = 0;
  const facade = createWorkspaceFacade({
    initialWorkspace: created.value,
    starterSnapshots: { landing: snapshotWorkspace(created.value) },
    databaseName,
    now: () => `2026-08-31T08:00:${String(id).padStart(2, "0")}.000Z`,
    newId: () => `generated-${++id}`,
  });
  openFacades.push(facade);
  databaseNames.push(databaseName);
  return facade;
};

const checkpoint = (id: string) => ({
  id,
  projectId: "checkpoint-validation-project",
  kind: "manual",
  label: "Stored checkpoint",
  sourceRevision: 0,
  snapshot: {
    starterId: "landing",
    activePath: "src/App.tsx",
    files: [{ path: "src/App.tsx", content: "stored" }],
  },
  createdAt: "2026-08-31T08:00:00.000Z",
});

afterEach(async () => {
  openFacades.splice(0).forEach((facade) => facade.close());
  for (const name of databaseNames.splice(0))
    await deletePatchworkDatabase(name);
});

describe("persisted checkpoint validation", () => {
  it.each([
    ["project identity", { projectId: "another-project" }],
    ["source revision", { sourceRevision: Number.MAX_SAFE_INTEGER + 1 }],
    ["starter identity", { snapshot: { starterId: "travel" } }],
    ["file collection shape", { snapshot: { files: {} } }],
    [
      "file path",
      { snapshot: { files: [{ path: "../escape.tsx", content: "stored" }] } },
    ],
    [
      "file byte size",
      {
        snapshot: {
          files: [
            {
              path: "src/App.tsx",
              content: "x".repeat(WORKSPACE_LIMITS.maxFileBytes + 1),
            },
          ],
        },
      },
    ],
  ])(
    "rejects a checkpoint with invalid %s without changing stored data",
    async (_label, override) => {
      const name = `patchwork-checkpoint-${crypto.randomUUID()}`;
      const facade = makeFacade(name);
      await facade.ready();
      const id = `corrupt-${crypto.randomUUID()}`;
      const base = checkpoint(id);
      const snapshotOverride = "snapshot" in override ? override.snapshot : {};
      const corrupted = {
        ...base,
        ...override,
        snapshot: {
          ...base.snapshot,
          ...(snapshotOverride as object),
        },
      };
      const before = facade.getState();
      const database = await openPatchworkDatabase(name);
      await database.put("checkpoints", corrupted as never);
      const storedWorkspaceBefore = await database.get(
        "workspaces",
        before.projectId,
      );
      database.close();

      const result = await facade.restoreCheckpoint({
        checkpointId: id,
        expectedRevision: before.revision,
        origin: "webmcp",
      });

      expect(result).toMatchObject({
        ok: false,
        error: {
          code: "PERSISTENCE_FAILED",
          retryable: false,
        },
      });
      expect(facade.getState()).toEqual(before);

      const verificationDatabase = await openPatchworkDatabase(name);
      expect(await verificationDatabase.get("checkpoints", id)).toEqual(
        corrupted,
      );
      expect(
        await verificationDatabase.get("workspaces", before.projectId),
      ).toEqual(storedWorkspaceBefore);
      expect(await verificationDatabase.getAll("activities")).toEqual([]);
      verificationDatabase.close();
    },
  );

  it("restores a valid checkpoint through the same boundary", async () => {
    const name = `patchwork-checkpoint-${crypto.randomUUID()}`;
    const facade = makeFacade(name);
    await facade.ready();
    await facade.writeFiles({
      writes: [{ path: "src/App.tsx", content: "changed" }],
      expectedRevision: 0,
      origin: "ui",
    });
    const checkpoints = await facade.listCheckpoints();
    if (!checkpoints.ok) throw new Error(checkpoints.error.message);

    const result = await facade.restoreCheckpoint({
      checkpointId: checkpoints.value[0].id,
      expectedRevision: 1,
      origin: "ui",
    });

    expect(result).toMatchObject({ ok: true, value: { revision: 2 } });
    expect(facade.getState().files["src/App.tsx"].content).toBe("initial");
  });
});
