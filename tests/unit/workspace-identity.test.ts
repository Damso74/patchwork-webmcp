import { describe, expect, it } from "vitest";
import { createWorkspaceState } from "../../src/domain/workspace/mutations";
import { prepareProjectExport } from "../../src/services/export";
import { landingStarter } from "../../src/starters/landing";
import {
  getWorkspaceProjectLabel,
  workspaceMatchesStarter,
} from "../../src/starters/workspaceIdentity";

const starterState = () => {
  const result = createWorkspaceState({
    projectId: "patchwork-landing",
    starterId: "landing",
    files: Object.fromEntries(
      Object.entries(landingStarter.files).map(([path, content]) => [
        path.replace(/^\/+/, ""),
        content,
      ]),
    ),
    activePath: "src/App.tsx",
    now: "2026-08-31T09:00:00.000Z",
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe("workspace identity", () => {
  it("uses the starter product name only while the content exactly matches it", () => {
    const workspace = starterState();
    expect(workspaceMatchesStarter(workspace, landingStarter)).toBe(true);
    expect(getWorkspaceProjectLabel(workspace, landingStarter)).toBe("Relay");

    workspace.files["src/App.tsx"] = {
      ...workspace.files["src/App.tsx"],
      content: "export default function App() { return <h1>Roamly</h1> }",
    };
    expect(workspaceMatchesStarter(workspace, landingStarter)).toBe(false);
    expect(getWorkspaceProjectLabel(workspace, landingStarter)).toBe(
      "Custom landing page",
    );
  });

  it("prepares a neutral archive name instead of retaining the starter brand", () => {
    const prepared = prepareProjectExport(starterState());
    expect(prepared).toMatchObject({
      ok: true,
      value: { filename: "patchwork-landing.zip" },
    });
  });
});
