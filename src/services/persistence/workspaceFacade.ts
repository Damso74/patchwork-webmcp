import type { IDBPDatabase } from "idb";
import {
  failure,
  persistenceFailure,
  success,
  type Result,
} from "../../domain/workspace/errors";
import { WORKSPACE_LIMITS } from "../../domain/workspace/limits";
import { planWorkspaceMutation } from "../../domain/workspace/mutations";
import { parseProjectPath } from "../../domain/workspace/paths";
import {
  listWorkspaceFiles,
  readWorkspaceFiles,
} from "../../domain/workspace/queries";
import type {
  ActivityEntry,
  FileSummary,
  MutationOrigin,
  MutationReceipt,
  ReadFile,
  WorkspaceCommand,
  WorkspaceSnapshot,
  WorkspaceState,
} from "../../domain/workspace/types";
import {
  buildProjectZip,
  prepareProjectExport,
  type ExportPreparation,
} from "../export";
import {
  canCreateManualCheckpoint,
  checkpointsToPrune,
  createCheckpointRecord,
  type Checkpoint,
} from "../checkpoints";
import { openPatchworkDatabase } from "./db";
import type { PatchworkDbSchema } from "./schema";

export interface WorkspaceFacadeOptions {
  initialWorkspace: WorkspaceState;
  starterSnapshots?: Record<string, WorkspaceSnapshot>;
  databaseName?: string;
  now?: () => string;
  newId?: () => string;
}

export interface WorkspaceFacade {
  ready(): Promise<void>;
  getState(): WorkspaceState;
  subscribe(listener: (state: WorkspaceState) => void): () => void;
  listFiles(prefix?: string): Result<FileSummary[]>;
  readFiles(paths: string[]): Result<ReadFile[]>;
  writeFiles(input: {
    writes: Array<{ path: string; content: string }>;
    expectedRevision?: number;
    origin: MutationOrigin;
  }): Promise<Result<MutationReceipt>>;
  moveFile(input: {
    from: string;
    to: string;
    expectedRevision?: number;
    origin: MutationOrigin;
  }): Promise<Result<MutationReceipt>>;
  deleteFile(input: {
    path: string;
    expectedRevision?: number;
    origin: MutationOrigin;
  }): Promise<Result<MutationReceipt>>;
  selectFile(path: string): Promise<Result<WorkspaceState>>;
  createCheckpoint(input: {
    label?: string;
    origin: MutationOrigin;
  }): Promise<Result<Checkpoint>>;
  restoreCheckpoint(input: {
    checkpointId: string;
    expectedRevision?: number;
    origin: MutationOrigin;
  }): Promise<Result<MutationReceipt>>;
  resetDemo(input: {
    expectedRevision?: number;
    origin: MutationOrigin;
  }): Promise<Result<MutationReceipt>>;
  listCheckpoints(): Promise<Result<Checkpoint[]>>;
  getActivities(): Promise<Result<ActivityEntry[]>>;
  prepareProjectExport(): Result<ExportPreparation>;
  buildProjectZip(): Promise<Result<Blob>>;
  close(): void;
}

const clone = <T>(value: T): T => structuredClone(value);
const defaultId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export const createWorkspaceFacade = (
  options: WorkspaceFacadeOptions,
): WorkspaceFacade => {
  const now = options.now ?? (() => new Date().toISOString());
  const newId = options.newId ?? defaultId;
  const databaseName = options.databaseName ?? "patchwork";
  const listeners = new Set<(state: WorkspaceState) => void>();
  let state = clone(options.initialWorkspace);
  let database: IDBPDatabase<PatchworkDbSchema> | null = null;
  let closed = false;
  let channel: BroadcastChannel | null = null;

  const notify = (): void => {
    const snapshot = clone(state);
    listeners.forEach((listener) => listener(snapshot));
  };

  const refreshFromDatabase = async (): Promise<void> => {
    if (!database || closed) return;
    const persisted = await database.get("workspaces", state.projectId);
    if (persisted) {
      state = persisted;
      notify();
    }
  };

  const initializing = (async () => {
    database = await openPatchworkDatabase(databaseName);
    const transaction = database.transaction("workspaces", "readwrite");
    const stored = await transaction.store.get(state.projectId);
    if (stored) state = stored;
    else await transaction.store.put(state);
    await transaction.done;

    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(`${databaseName}:workspace`);
      channel.onmessage = (event: MessageEvent<{ projectId?: string }>) => {
        if (event.data?.projectId === state.projectId)
          void refreshFromDatabase();
      };
    }
  })();

  const ensureDatabase = async (): Promise<IDBPDatabase<PatchworkDbSchema>> => {
    await initializing;
    if (!database || closed) throw new Error("Workspace facade is closed.");
    return database;
  };

  const publish = (): void => {
    channel?.postMessage({ projectId: state.projectId });
    notify();
  };

  const activitiesToPrune = (activities: ActivityEntry[]): ActivityEntry[] =>
    activities
      .sort(
        (a, b) =>
          a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
      )
      .slice(
        0,
        Math.max(0, activities.length - WORKSPACE_LIMITS.maxActivityEntries),
      );

  const commitMutation = async (
    command: WorkspaceCommand,
  ): Promise<Result<MutationReceipt>> => {
    try {
      const db = await ensureDatabase();
      const transaction = db.transaction(
        ["workspaces", "checkpoints", "activities"],
        "readwrite",
      );
      const workspaceStore = transaction.objectStore("workspaces");
      const persisted = await workspaceStore.get(state.projectId);
      if (!persisted) {
        await transaction.done;
        return failure({
          code: "NOT_READY",
          message: "Workspace is not initialized.",
          retryable: true,
        });
      }

      const timestamp = now();
      const planned = planWorkspaceMutation(persisted, command, {
        now: timestamp,
        newId,
      });
      if (!planned.ok) {
        await transaction.done;
        return planned;
      }

      const checkpoint = createCheckpointRecord({
        state: persisted,
        id: newId(),
        now: timestamp,
        kind: planned.value.checkpointKind,
      });
      await transaction.objectStore("checkpoints").put(checkpoint);
      await workspaceStore.put(planned.value.next);
      await transaction.objectStore("activities").put(planned.value.activity);

      const checkpoints = await transaction
        .objectStore("checkpoints")
        .index("by-project")
        .getAll(state.projectId);
      for (const stale of checkpointsToPrune(checkpoints)) {
        await transaction.objectStore("checkpoints").delete(stale.id);
      }
      const activityStore = transaction.objectStore("activities");
      const activities = await activityStore
        .index("by-project")
        .getAll(state.projectId);
      for (const stale of activitiesToPrune(activities))
        await activityStore.delete(stale.id);
      await transaction.done;

      state = planned.value.next;
      publish();
      return success({
        revision: state.revision,
        checkpointId: checkpoint.id,
        changedPaths: planned.value.changedPaths,
      });
    } catch {
      return failure(persistenceFailure());
    }
  };

  return {
    ready: () => initializing,
    getState: () => clone(state),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    listFiles: (prefix) => listWorkspaceFiles(state, prefix),
    readFiles: (paths) => readWorkspaceFiles(state, paths),
    writeFiles: (input) => commitMutation({ kind: "write", ...input }),
    moveFile: (input) => commitMutation({ kind: "move", ...input }),
    deleteFile: (input) => commitMutation({ kind: "delete", ...input }),
    async selectFile(rawPath) {
      const parsed = parseProjectPath(rawPath);
      if (!parsed.ok) return parsed;
      try {
        const db = await ensureDatabase();
        const transaction = db.transaction("workspaces", "readwrite");
        const persisted = await transaction.store.get(state.projectId);
        if (!persisted?.files[parsed.value]) {
          await transaction.done;
          return failure({
            code: "FILE_NOT_FOUND",
            message: "The selected file does not exist.",
            path: rawPath,
            retryable: false,
          });
        }
        const next = { ...persisted, activePath: parsed.value };
        await transaction.store.put(next);
        await transaction.done;
        state = next;
        publish();
        return success(clone(state));
      } catch {
        return failure(persistenceFailure());
      }
    },
    async createCheckpoint(input) {
      try {
        const db = await ensureDatabase();
        const transaction = db.transaction(
          ["workspaces", "checkpoints", "activities"],
          "readwrite",
        );
        const persisted = await transaction
          .objectStore("workspaces")
          .get(state.projectId);
        if (!persisted) {
          await transaction.done;
          return failure({
            code: "NOT_READY",
            message: "Workspace is not initialized.",
            retryable: true,
          });
        }
        const existing = await transaction
          .objectStore("checkpoints")
          .index("by-project")
          .getAll(state.projectId);
        if (!canCreateManualCheckpoint(existing)) {
          await transaction.done;
          return failure({
            code: "CHECKPOINT_LIMIT_REACHED",
            message: `At most ${WORKSPACE_LIMITS.maxManualCheckpoints} manual checkpoints are retained.`,
            retryable: false,
            suggestion:
              "Restore or remove an older manual checkpoint before creating another.",
          });
        }
        const timestamp = now();
        const checkpoint = createCheckpointRecord({
          state: persisted,
          id: newId(),
          now: timestamp,
          kind: "manual",
          label: input.label,
          origin: input.origin,
        });
        const activity: ActivityEntry = {
          id: newId(),
          projectId: persisted.projectId,
          type: "checkpoint_created",
          origin: input.origin,
          revision: persisted.revision,
          paths: [],
          summary: `Created checkpoint ${checkpoint.label}.`,
          createdAt: timestamp,
        };
        await transaction.objectStore("checkpoints").put(checkpoint);
        await transaction.objectStore("activities").put(activity);
        const activityStore = transaction.objectStore("activities");
        const activities = await activityStore
          .index("by-project")
          .getAll(state.projectId);
        for (const stale of activitiesToPrune(activities))
          await activityStore.delete(stale.id);
        await transaction.done;
        channel?.postMessage({ projectId: state.projectId });
        return success(checkpoint);
      } catch {
        return failure(persistenceFailure());
      }
    },
    async restoreCheckpoint(input) {
      try {
        const db = await ensureDatabase();
        const checkpoint = await db.get("checkpoints", input.checkpointId);
        if (!checkpoint || checkpoint.projectId !== state.projectId) {
          return failure({
            code: "CHECKPOINT_NOT_FOUND",
            message: "The requested checkpoint does not exist.",
            retryable: false,
          });
        }
        return commitMutation({
          kind: "restore",
          snapshot: checkpoint.snapshot,
          ...input,
        });
      } catch {
        return failure(persistenceFailure());
      }
    },
    async resetDemo(input) {
      const snapshot =
        options.starterSnapshots?.[state.starterId] ??
        (state.starterId === options.initialWorkspace.starterId
          ? {
              starterId: options.initialWorkspace.starterId,
              activePath: options.initialWorkspace.activePath,
              files: Object.values(options.initialWorkspace.files).map(
                ({ path, content }) => ({ path, content }),
              ),
            }
          : undefined);
      if (!snapshot) {
        return failure({
          code: "NOT_READY",
          message: "No deterministic snapshot exists for this starter.",
          retryable: false,
        });
      }
      return commitMutation({ kind: "reset", snapshot, ...input });
    },
    async listCheckpoints() {
      try {
        const db = await ensureDatabase();
        const checkpoints = await db.getAllFromIndex(
          "checkpoints",
          "by-project",
          state.projectId,
        );
        return success(
          checkpoints.sort(
            (a, b) =>
              b.createdAt.localeCompare(a.createdAt) ||
              b.id.localeCompare(a.id),
          ),
        );
      } catch {
        return failure(persistenceFailure());
      }
    },
    async getActivities() {
      try {
        const db = await ensureDatabase();
        const activities = await db.getAllFromIndex(
          "activities",
          "by-project",
          state.projectId,
        );
        return success(
          activities.sort(
            (a, b) =>
              b.createdAt.localeCompare(a.createdAt) ||
              b.id.localeCompare(a.id),
          ),
        );
      } catch {
        return failure(persistenceFailure());
      }
    },
    prepareProjectExport: () => prepareProjectExport(state),
    async buildProjectZip() {
      try {
        return success(await buildProjectZip(state));
      } catch {
        return failure({
          code: "PERSISTENCE_FAILED",
          message: "The project archive could not be created.",
          retryable: true,
        });
      }
    },
    close() {
      closed = true;
      channel?.close();
      database?.close();
      listeners.clear();
    },
  };
};
