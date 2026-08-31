import type { StarterId } from "../../starters";

const PERSISTENT_DATABASE_NAME = "patchwork-workspaces";
const FRESH_DATABASE_PREFIX = "patchwork-workspaces-fresh";

export interface WorkspaceSessionConfig {
  databaseName: string;
  fresh: boolean;
  resetStoredStateOnInitialize: boolean;
}

/**
 * `fresh=1` uses a page-scoped database that is reset when the page opens.
 * Separate demo tabs cannot reset or broadcast stale state into one another,
 * and the regular persistent database is never opened or cleared by the route.
 */
export const getWorkspaceSessionConfig = (
  search: string,
  starterId: StarterId,
  freshSessionId = crypto.randomUUID(),
): WorkspaceSessionConfig => {
  const fresh = new URLSearchParams(search).get("fresh") === "1";
  return {
    databaseName: fresh
      ? `${FRESH_DATABASE_PREFIX}-${starterId}-${freshSessionId}`
      : PERSISTENT_DATABASE_NAME,
    fresh,
    resetStoredStateOnInitialize: fresh,
  };
};
