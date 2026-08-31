import type { WorkspaceState } from "../domain/workspace/types";
import type { StarterDefinition } from "./types";

export const workspaceMatchesStarter = (
  workspace: WorkspaceState,
  starter: StarterDefinition,
): boolean => {
  const starterEntries = Object.entries(starter.files).map(
    ([path, content]) => [path.replace(/^\/+/, ""), content],
  );
  if (Object.keys(workspace.files).length !== starterEntries.length)
    return false;
  return starterEntries.every(
    ([path, content]) => workspace.files[path]?.content === content,
  );
};

export const getWorkspaceProjectLabel = (
  workspace: WorkspaceState,
  starter: StarterDefinition,
): string =>
  workspaceMatchesStarter(workspace, starter)
    ? starter.projectName
    : `Custom ${starter.name.toLowerCase()}`;
