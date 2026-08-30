import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { createWorkspaceState } from "../../src/domain/workspace/mutations";
import { buildProjectZip } from "../../src/services/export/buildZip";
import { prepareProjectExport } from "../../src/services/export/prepareExport";

const state = () => {
  const result = createWorkspaceState({
    projectId: "Roamly Demo",
    starterId: "landing",
    files: { "src/App.tsx": "hello", "src/styles.css": "body {}" },
    now: "2026-08-30T03:00:00.000Z",
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe("project export", () => {
  it("prepares a stable manifest without mutating the workspace", () => {
    const workspace = state();
    const before = structuredClone(workspace);
    const result = prepareProjectExport(workspace);
    expect(result).toMatchObject({
      ok: true,
      value: {
        filename: "roamly-demo.zip",
        revision: 0,
        files: [{ path: "src/App.tsx" }, { path: "src/styles.css" }],
      },
    });
    expect(workspace).toEqual(before);
  });

  it("builds an archive containing exactly the workspace files", async () => {
    const blob = await buildProjectZip(state());
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const fileNames = Object.values(zip.files)
      .filter((entry) => !entry.dir)
      .map((entry) => entry.name)
      .sort();
    expect(fileNames).toEqual(["src/App.tsx", "src/styles.css"]);
    expect(await zip.file("src/App.tsx")!.async("string")).toBe("hello");
  });
});
