import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createWorkspaceState } from "../../domain/workspace/mutations";
import type {
  WorkspaceSnapshot,
  WorkspaceState,
} from "../../domain/workspace/types";
import { prepareProjectExport } from "../../services/export";
import { createWorkspaceFacade } from "../../services/persistence/workspaceFacade";
import { getWorkspaceSessionConfig } from "../../services/persistence/workspaceSession";
import { getStarter, getWorkspaceProjectLabel, starters } from "../../starters";
import type { StarterId } from "../../starters";
import { toActivityItem, type ActivityItem } from "./activityPresentation";

export type { ActivityItem, ActivityToolName } from "./activityPresentation";

const searchParams = new URLSearchParams(window.location.search);
const requestedDemo = searchParams.get("demo");
const initialStarter = getStarter(requestedDemo);
const sessionConfig = getWorkspaceSessionConfig(
  window.location.search,
  initialStarter.id,
  crypto.randomUUID(),
);
const domainStarterFiles = Object.fromEntries(
  Object.entries(initialStarter.files).map(([path, content]) => [
    path.replace(/^\/+/, ""),
    content,
  ]),
);
const initialResult = createWorkspaceState({
  projectId: `patchwork-${initialStarter.id}`,
  starterId: initialStarter.id,
  files: domainStarterFiles,
  activePath: "src/App.tsx",
  now: new Date().toISOString(),
});

if (!initialResult.ok) throw new Error(initialResult.error.message);

const starterSnapshot: WorkspaceSnapshot = {
  starterId: initialStarter.id,
  activePath: initialResult.value.activePath,
  files: Object.values(initialResult.value.files).map(({ path, content }) => ({
    path,
    content,
  })),
};

/** Shared by the UI and imported by the WebMCP registration layer. */
export const workspaceFacade = createWorkspaceFacade({
  initialWorkspace: initialResult.value,
  starterSnapshots: { [initialStarter.id]: starterSnapshot },
  databaseName: sessionConfig.databaseName,
  resetStoredStateOnInitialize: sessionConfig.resetStoredStateOnInitialize,
});

export interface CheckpointItem {
  id: string;
  name: string;
  revision: number;
  timestamp: string;
}

const filesFromState = (state: WorkspaceState): Record<string, string> =>
  Object.fromEntries(
    Object.values(state.files).map((file) => [`/${file.path}`, file.content]),
  );

const toDomainPath = (path: string): string => path.replace(/^\/+/, "");

export function useWorkspaceController() {
  const [workspace, setWorkspace] = useState(() => workspaceFacade.getState());
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [checkpoints, setCheckpoints] = useState<CheckpointItem[]>([]);
  const [saveState, setSaveState] = useState<
    "saved" | "saving" | "memory" | "conflict"
  >("saving");
  const pendingEdit = useRef<{
    path: string;
    code: string;
    expectedRevision: number;
  } | null>(null);
  const editBaseRevision = useRef<{ path: string; revision: number } | null>(
    null,
  );
  const editConflict = useRef(false);
  const uiFlushInFlight = useRef(false);
  const flushInFlight = useRef<Promise<void> | null>(null);
  const editTimer = useRef<number | undefined>(undefined);

  const refreshMetadata = useCallback(async () => {
    const [activityResult, checkpointResult] = await Promise.all([
      workspaceFacade.getActivities(),
      workspaceFacade.listCheckpoints(),
    ]);
    if (activityResult.ok) {
      setActivities(activityResult.value.map(toActivityItem));
    }
    if (checkpointResult.ok) {
      setCheckpoints(
        checkpointResult.value.map((item) => ({
          id: item.id,
          name: item.label,
          revision: item.sourceRevision,
          timestamp: item.createdAt,
        })),
      );
    }
  }, []);

  useEffect(() => {
    const unsubscribe = workspaceFacade.subscribe((next) => {
      if (pendingEdit.current) {
        if (
          !uiFlushInFlight.current &&
          next.revision !== editBaseRevision.current?.revision
        ) {
          editConflict.current = true;
        }
        void refreshMetadata();
        return;
      }
      setWorkspace(next);
      setSaveState("saved");
      void refreshMetadata();
    });
    void workspaceFacade
      .ready()
      .then(() => {
        setWorkspace(workspaceFacade.getState());
        setSaveState("saved");
        void refreshMetadata();
      })
      .catch(() => setSaveState("memory"));
    return unsubscribe;
  }, [refreshMetadata]);

  const flushPendingEdit = useCallback(
    function drainPendingEdit(): Promise<void> {
      if (flushInFlight.current) return flushInFlight.current;
      if (!pendingEdit.current) return Promise.resolve();

      uiFlushInFlight.current = true;
      let operation: Promise<void>;
      operation = Promise.resolve().then(async () => {
        try {
          while (pendingEdit.current) {
            const pending = pendingEdit.current;
            window.clearTimeout(editTimer.current);
            editTimer.current = undefined;
            const current = workspaceFacade.getState();
            if (editConflict.current) {
              pendingEdit.current = null;
              editBaseRevision.current = null;
              editConflict.current = false;
              setWorkspace(current);
              setSaveState("conflict");
              return;
            }
            if (current.files[pending.path]?.content === pending.code) {
              if (pendingEdit.current === pending) {
                pendingEdit.current = null;
                editBaseRevision.current = null;
              }
              continue;
            }
            setSaveState("saving");
            const result = await workspaceFacade.writeFiles({
              writes: [{ path: pending.path, content: pending.code }],
              expectedRevision: pending.expectedRevision,
              origin: "ui",
            });
            const newerPending = pendingEdit.current;
            const samePendingContent =
              newerPending?.path === pending.path &&
              newerPending.code === pending.code;
            if (result.ok) {
              if (samePendingContent) {
                pendingEdit.current = null;
                editBaseRevision.current = null;
                setWorkspace(workspaceFacade.getState());
                setSaveState("saved");
              } else if (newerPending) {
                editBaseRevision.current = {
                  path: newerPending.path,
                  revision: result.value.revision,
                };
                pendingEdit.current = {
                  ...newerPending,
                  expectedRevision: result.value.revision,
                };
              }
            } else if (samePendingContent) {
              pendingEdit.current = null;
              editBaseRevision.current = null;
              setWorkspace(workspaceFacade.getState());
              setSaveState(
                result.error.code === "REVISION_CONFLICT"
                  ? "conflict"
                  : result.error.code === "PERSISTENCE_FAILED"
                    ? "memory"
                    : "saved",
              );
            } else {
              if (result.error.code === "REVISION_CONFLICT") {
                editConflict.current = true;
              }
              setSaveState(
                result.error.code === "REVISION_CONFLICT"
                  ? "conflict"
                  : result.error.code === "PERSISTENCE_FAILED"
                    ? "memory"
                    : "saved",
              );
              return;
            }
          }
        } finally {
          uiFlushInFlight.current = false;
          if (flushInFlight.current === operation) flushInFlight.current = null;
          if (pendingEdit.current && !editConflict.current) {
            window.clearTimeout(editTimer.current);
            editTimer.current = window.setTimeout(() => {
              editTimer.current = undefined;
              void drainPendingEdit();
            }, 450);
          }
        }
      });
      flushInFlight.current = operation;
      return operation;
    },
    [],
  );

  const updateActiveFile = useCallback(
    (code: string) => {
      const current = workspaceFacade.getState();
      if (
        !current.activePath ||
        current.files[current.activePath]?.content === code
      )
        return;
      const pending = pendingEdit.current;
      if (pending?.path === current.activePath && pending.code === code) return;
      const base = editBaseRevision.current;
      if (!base || base.path !== current.activePath) {
        editBaseRevision.current = {
          path: current.activePath,
          revision: current.revision,
        };
      }
      pendingEdit.current = {
        path: current.activePath,
        code,
        expectedRevision:
          editBaseRevision.current?.revision ?? current.revision,
      };
      setSaveState("saving");
      window.clearTimeout(editTimer.current);
      editTimer.current = window.setTimeout(() => {
        editTimer.current = undefined;
        void flushPendingEdit();
      }, 450);
    },
    [flushPendingEdit],
  );

  const selectFile = useCallback(
    async (path: string) => {
      await flushPendingEdit();
      await workspaceFacade.selectFile(toDomainPath(path));
    },
    [flushPendingEdit],
  );

  const selectStarter = useCallback((id: StarterId) => {
    if (id === initialStarter.id) return;
    const url = new URL(window.location.href);
    url.searchParams.set("demo", id);
    window.location.assign(url);
  }, []);

  const createCheckpoint = useCallback(
    async (name?: string) => {
      await flushPendingEdit();
      await workspaceFacade.createCheckpoint({ label: name, origin: "ui" });
      await refreshMetadata();
    },
    [flushPendingEdit, refreshMetadata],
  );

  const restoreCheckpoint = useCallback(
    async (id: string) => {
      await flushPendingEdit();
      await workspaceFacade.restoreCheckpoint({
        checkpointId: id,
        expectedRevision: workspaceFacade.getState().revision,
        origin: "ui",
      });
    },
    [flushPendingEdit],
  );

  const resetDemo = useCallback(async () => {
    await flushPendingEdit();
    window.clearTimeout(editTimer.current);
    editTimer.current = undefined;
    pendingEdit.current = null;
    editBaseRevision.current = null;
    editConflict.current = false;
    const result = await workspaceFacade.resetDemo({
      expectedRevision: workspaceFacade.getState().revision,
      origin: "ui",
    });
    setWorkspace(workspaceFacade.getState());
    setSaveState(
      result.ok
        ? "saved"
        : result.error.code === "REVISION_CONFLICT"
          ? "conflict"
          : result.error.code === "PERSISTENCE_FAILED"
            ? "memory"
            : "saved",
    );
    return result.ok;
  }, [flushPendingEdit]);

  const createFile = useCallback(
    async (path: string) => {
      await flushPendingEdit();
      const normalized = toDomainPath(path);
      const result = await workspaceFacade.writeFiles({
        writes: [{ path: normalized, content: "" }],
        expectedRevision: workspaceFacade.getState().revision,
        origin: "ui",
      });
      if (result.ok) await workspaceFacade.selectFile(normalized);
      return result.ok;
    },
    [flushPendingEdit],
  );

  const moveFile = useCallback(
    async (from: string, to: string) => {
      await flushPendingEdit();
      const normalized = toDomainPath(to);
      const result = await workspaceFacade.moveFile({
        from: toDomainPath(from),
        to: normalized,
        expectedRevision: workspaceFacade.getState().revision,
        origin: "ui",
      });
      return result.ok;
    },
    [flushPendingEdit],
  );

  const deleteFile = useCallback(
    async (path: string) => {
      await flushPendingEdit();
      const result = await workspaceFacade.deleteFile({
        path: toDomainPath(path),
        expectedRevision: workspaceFacade.getState().revision,
        origin: "ui",
      });
      return result.ok;
    },
    [flushPendingEdit],
  );

  const exportProject = useCallback(async () => {
    await flushPendingEdit();
    const preparation = workspaceFacade.prepareProjectExport();
    if (!preparation.ok) return;
    const result = await workspaceFacade.buildProjectZip();
    if (!result.ok) return;
    const url = URL.createObjectURL(result.value);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = preparation.value.filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [flushPendingEdit]);

  const files = useMemo(() => filesFromState(workspace), [workspace]);
  const projectLabel = useMemo(
    () => getWorkspaceProjectLabel(workspace, initialStarter),
    [workspace],
  );
  const exportPreparation = useMemo(
    () => prepareProjectExport(workspace),
    [workspace],
  );

  return {
    starter: initialStarter,
    projectLabel,
    projectName: projectLabel,
    exportFilename: exportPreparation.ok
      ? exportPreparation.value.filename
      : "patchwork-project.zip",
    freshSession: sessionConfig.fresh,
    starters,
    files,
    activeFile: workspace.activePath
      ? `/${workspace.activePath}`
      : (Object.keys(files)[0] ?? ""),
    revision: workspace.revision,
    activities,
    checkpoints,
    saveState,
    selectFile,
    updateActiveFile,
    selectStarter,
    createCheckpoint,
    restoreCheckpoint,
    resetDemo,
    createFile,
    moveFile,
    deleteFile,
    exportProject,
  };
}

export type WorkspaceController = ReturnType<typeof useWorkspaceController>;
