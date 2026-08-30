import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createWorkspaceState } from "../../domain/workspace/mutations";
import type {
  WorkspaceSnapshot,
  WorkspaceState,
} from "../../domain/workspace/types";
import { createWorkspaceFacade } from "../../services/persistence/workspaceFacade";
import { getStarter, starters } from "../../starters";
import type { StarterId } from "../../starters";

const requestedDemo = new URLSearchParams(window.location.search).get("demo");
const initialStarter = getStarter(requestedDemo);
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
  databaseName: "patchwork-workspaces",
});

export interface ActivityItem {
  id: string;
  action: string;
  detail: string;
  revision: number;
  timestamp: string;
  tone?: "success" | "warning";
}

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
  const editTimer = useRef<number | undefined>(undefined);

  const refreshMetadata = useCallback(async () => {
    const [activityResult, checkpointResult] = await Promise.all([
      workspaceFacade.getActivities(),
      workspaceFacade.listCheckpoints(),
    ]);
    if (activityResult.ok) {
      setActivities(
        activityResult.value.map((item) => ({
          id: item.id,
          action:
            item.origin === "webmcp"
              ? "Site tool activity"
              : item.type.replaceAll("_", " "),
          detail: item.summary,
          revision: item.revision,
          timestamp: item.createdAt,
          tone:
            item.type === "file_deleted"
              ? ("warning" as const)
              : ("success" as const),
        })),
      );
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

  const flushPendingEdit = useCallback(async () => {
    const pending = pendingEdit.current;
    if (!pending) return;
    window.clearTimeout(editTimer.current);
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
      pendingEdit.current = null;
      return;
    }
    setSaveState("saving");
    uiFlushInFlight.current = true;
    const result = await workspaceFacade.writeFiles({
      writes: [{ path: pending.path, content: pending.code }],
      expectedRevision: pending.expectedRevision,
      origin: "ui",
    });
    uiFlushInFlight.current = false;
    const newerPending = pendingEdit.current;
    const samePendingContent =
      newerPending?.path === pending.path && newerPending.code === pending.code;
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
    }
  }, []);

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
      editTimer.current = window.setTimeout(() => void flushPendingEdit(), 450);
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
    pendingEdit.current = null;
    editBaseRevision.current = null;
    editConflict.current = false;
    window.clearTimeout(editTimer.current);
    await workspaceFacade.resetDemo({
      expectedRevision: workspaceFacade.getState().revision,
      origin: "ui",
    });
  }, []);

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
    const result = await workspaceFacade.buildProjectZip();
    if (!result.ok) return;
    const url = URL.createObjectURL(result.value);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${initialStarter.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.zip`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [flushPendingEdit]);

  const files = useMemo(() => filesFromState(workspace), [workspace]);

  return {
    starter: initialStarter,
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
