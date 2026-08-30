import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import {
  createWorkspaceState,
  snapshotWorkspace,
} from "../../src/domain/workspace/mutations";
import { deletePatchworkDatabase } from "../../src/services/persistence/db";
import {
  createWorkspaceFacade,
  type WorkspaceFacade,
} from "../../src/services/persistence/workspaceFacade";

const openFacades: WorkspaceFacade[] = [];
const databaseNames: string[] = [];

const makeFacade = (databaseName: string) => {
  const created = createWorkspaceState({
    projectId: "persistent-project",
    starterId: "landing",
    files: {
      "src/App.tsx": "initial",
      "src/styles.css": "body {}",
      "package.json": "{}",
    },
    activePath: "src/App.tsx",
    now: "2026-08-30T03:00:00.000Z",
  });
  if (!created.ok) throw new Error(created.error.message);
  let id = 0;
  const facade = createWorkspaceFacade({
    initialWorkspace: created.value,
    starterSnapshots: { landing: snapshotWorkspace(created.value) },
    databaseName,
    now: () => `2026-08-30T03:00:${String(id).padStart(2, "0")}.000Z`,
    newId: () => `id-${++id}`,
  });
  openFacades.push(facade);
  databaseNames.push(databaseName);
  return facade;
};

afterEach(async () => {
  openFacades.splice(0).forEach((facade) => facade.close());
  for (const name of databaseNames.splice(0))
    await deletePatchworkDatabase(name);
});

describe("persistent workspace facade", () => {
  it("commits workspace, one checkpoint, and one activity together", async () => {
    const facade = makeFacade(`patchwork-test-${crypto.randomUUID()}`);
    await facade.ready();
    const result = await facade.writeFiles({
      writes: [{ path: "src/App.tsx", content: "updated" }],
      expectedRevision: 0,
      origin: "webmcp",
    });

    expect(result).toMatchObject({
      ok: true,
      value: { revision: 1, changedPaths: ["src/App.tsx"] },
    });
    expect(await facade.listCheckpoints()).toMatchObject({
      ok: true,
      value: [{ kind: "automatic", sourceRevision: 0 }],
    });
    expect(await facade.getActivities()).toMatchObject({
      ok: true,
      value: [{ type: "files_written", revision: 1 }],
    });
  });

  it("does not persist any part of an invalid batch", async () => {
    const facade = makeFacade(`patchwork-test-${crypto.randomUUID()}`);
    await facade.ready();
    const before = facade.getState();
    const result = await facade.writeFiles({
      writes: [
        { path: "src/App.tsx", content: "valid alone" },
        { path: "../escape.ts", content: "invalid" },
      ],
      origin: "webmcp",
    });

    expect(result.ok).toBe(false);
    expect(facade.getState()).toEqual(before);
    expect(await facade.listCheckpoints()).toEqual({ ok: true, value: [] });
    expect(await facade.getActivities()).toEqual({ ok: true, value: [] });
  });

  it("restores an automatic checkpoint and creates a safety checkpoint", async () => {
    const facade = makeFacade(`patchwork-test-${crypto.randomUUID()}`);
    await facade.ready();
    await facade.writeFiles({
      writes: [{ path: "src/App.tsx", content: "changed" }],
      origin: "ui",
    });
    const checkpoints = await facade.listCheckpoints();
    if (!checkpoints.ok) throw new Error(checkpoints.error.message);

    const restored = await facade.restoreCheckpoint({
      checkpointId: checkpoints.value[0].id,
      expectedRevision: 1,
      origin: "ui",
    });
    expect(restored).toMatchObject({ ok: true, value: { revision: 2 } });
    expect(facade.getState().files["src/App.tsx"].content).toBe("initial");
    const after = await facade.listCheckpoints();
    expect(
      after.ok &&
        after.value.some((checkpoint) => checkpoint.kind === "restore-safety"),
    ).toBe(true);
  });

  it("reloads persisted state and keeps reads side-effect free", async () => {
    const name = `patchwork-test-${crypto.randomUUID()}`;
    const first = makeFacade(name);
    await first.ready();
    await first.writeFiles({
      writes: [{ path: "src/App.tsx", content: "persisted" }],
      origin: "ui",
    });
    const checkpointsBefore = await first.listCheckpoints();
    const activitiesBefore = await first.getActivities();
    first.close();

    const second = makeFacade(name);
    await second.ready();
    expect(second.getState().files["src/App.tsx"].content).toBe("persisted");
    expect(second.listFiles().ok).toBe(true);
    expect(second.readFiles(["src/App.tsx"]).ok).toBe(true);
    expect(await second.listCheckpoints()).toEqual(checkpointsBefore);
    expect(await second.getActivities()).toEqual(activitiesBefore);
  });

  it("resets the demo to its immutable starter snapshot", async () => {
    const facade = makeFacade(`patchwork-test-${crypto.randomUUID()}`);
    await facade.ready();
    await facade.writeFiles({
      writes: [{ path: "src/App.tsx", content: "changed" }],
      origin: "ui",
    });
    const result = await facade.resetDemo({
      expectedRevision: 1,
      origin: "ui",
    });
    expect(result).toMatchObject({ ok: true, value: { revision: 2 } });
    expect(facade.getState().files["src/App.tsx"].content).toBe("initial");
  });
});
