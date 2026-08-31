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
import { getWorkspaceSessionConfig } from "../../src/services/persistence/workspaceSession";

const openFacades: WorkspaceFacade[] = [];
const databaseNames = new Set<string>();

const makeFacade = (databaseName: string, reset = false) => {
  const created = createWorkspaceState({
    projectId: "patchwork-landing",
    starterId: "landing",
    files: { "src/App.tsx": "Relay" },
    activePath: "src/App.tsx",
    now: "2026-08-31T09:00:00.000Z",
  });
  if (!created.ok) throw new Error(created.error.message);
  let id = 0;
  const facade = createWorkspaceFacade({
    initialWorkspace: created.value,
    starterSnapshots: { landing: snapshotWorkspace(created.value) },
    databaseName,
    resetStoredStateOnInitialize: reset,
    now: () => `2026-08-31T09:00:${String(id).padStart(2, "0")}.000Z`,
    newId: () => `${databaseName}-${++id}`,
  });
  openFacades.push(facade);
  databaseNames.add(databaseName);
  return facade;
};

afterEach(async () => {
  openFacades.splice(0).forEach((facade) => facade.close());
  for (const name of databaseNames) await deletePatchworkDatabase(name);
  databaseNames.clear();
});

describe("workspace session configuration", () => {
  it("keeps the regular persistent namespace unless fresh=1 is explicit", () => {
    expect(getWorkspaceSessionConfig("?demo=landing", "landing")).toEqual({
      databaseName: "patchwork-workspaces",
      fresh: false,
      resetStoredStateOnInitialize: false,
    });
    expect(
      getWorkspaceSessionConfig("?demo=travel&fresh=1", "travel", "unit-tab"),
    ).toEqual({
      databaseName: "patchwork-workspaces-fresh-travel-unit-tab",
      fresh: true,
      resetStoredStateOnInitialize: true,
    });
    expect(getWorkspaceSessionConfig("?fresh=true", "landing").fresh).toBe(
      false,
    );
  });

  it("isolates simultaneous fresh demo pages", () => {
    const first = getWorkspaceSessionConfig("?fresh=1", "landing", "tab-a");
    const second = getWorkspaceSessionConfig("?fresh=1", "landing", "tab-b");

    expect(first.databaseName).not.toBe(second.databaseName);
    expect(first.resetStoredStateOnInitialize).toBe(true);
    expect(second.resetStoredStateOnInitialize).toBe(true);
  });

  it("resets only the isolated fresh namespace and preserves the normal workspace", async () => {
    const suffix = crypto.randomUUID();
    const normalName = `patchwork-normal-${suffix}`;
    const freshName = `patchwork-fresh-${suffix}`;

    const normal = makeFacade(normalName);
    await normal.ready();
    await normal.writeFiles({
      writes: [{ path: "src/App.tsx", content: "Normal saved work" }],
      origin: "ui",
    });
    normal.close();

    const firstFresh = makeFacade(freshName, true);
    await firstFresh.ready();
    await firstFresh.writeFiles({
      writes: [{ path: "src/App.tsx", content: "Temporary demo work" }],
      origin: "webmcp",
    });
    firstFresh.close();

    const reloadedFresh = makeFacade(freshName, true);
    await reloadedFresh.ready();
    expect(reloadedFresh.getState()).toMatchObject({
      revision: 0,
      files: { "src/App.tsx": { content: "Relay" } },
    });
    expect(await reloadedFresh.listCheckpoints()).toEqual({
      ok: true,
      value: [],
    });
    expect(await reloadedFresh.getActivities()).toEqual({
      ok: true,
      value: [],
    });

    const reloadedNormal = makeFacade(normalName);
    await reloadedNormal.ready();
    expect(reloadedNormal.getState()).toMatchObject({
      revision: 1,
      files: { "src/App.tsx": { content: "Normal saved work" } },
    });
  });
});
