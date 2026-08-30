export type ProjectPath = string & { readonly __projectPath: unique symbol };
export type Revision = number & { readonly __revision: unique symbol };
export type CheckpointId = string & { readonly __checkpointId: unique symbol };

export type StarterId = "landing" | "dashboard" | "travel" | (string & {});
export type MutationOrigin = "ui" | "webmcp" | "system";

export interface WorkspaceFile {
  path: ProjectPath;
  content: string;
  sizeBytes: number;
  updatedAt: string;
}

export interface WorkspaceState {
  schemaVersion: 1;
  projectId: string;
  starterId: StarterId;
  revision: Revision;
  activePath: ProjectPath | null;
  files: Record<string, WorkspaceFile>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceSnapshot {
  starterId: StarterId;
  activePath: ProjectPath | null;
  files: Array<{ path: ProjectPath; content: string }>;
}

export type ActivityType =
  | "files_written"
  | "file_moved"
  | "file_deleted"
  | "checkpoint_created"
  | "checkpoint_restored"
  | "demo_reset";

export interface ActivityEntry {
  id: string;
  projectId: string;
  type: ActivityType;
  origin: MutationOrigin;
  revision: Revision;
  paths: ProjectPath[];
  summary: string;
  createdAt: string;
}

export interface FileSummary {
  path: ProjectPath;
  sizeBytes: number;
  extension: string;
}

export interface ReadFile {
  path: ProjectPath;
  content: string;
  sizeBytes: number;
  revision: Revision;
}

export type WorkspaceCommand =
  | {
      kind: "write";
      writes: Array<{ path: string; content: string }>;
      expectedRevision?: number;
      origin: MutationOrigin;
    }
  | {
      kind: "move";
      from: string;
      to: string;
      expectedRevision?: number;
      origin: MutationOrigin;
    }
  | {
      kind: "delete";
      path: string;
      expectedRevision?: number;
      origin: MutationOrigin;
    }
  | {
      kind: "restore";
      checkpointId: string;
      snapshot: WorkspaceSnapshot;
      expectedRevision?: number;
      origin: MutationOrigin;
    }
  | {
      kind: "reset";
      snapshot: WorkspaceSnapshot;
      expectedRevision?: number;
      origin: MutationOrigin;
    };

export interface MutationPlan {
  previous: WorkspaceState;
  next: WorkspaceState;
  beforeSnapshot: WorkspaceSnapshot;
  activity: ActivityEntry;
  changedPaths: ProjectPath[];
  checkpointKind: "automatic" | "restore-safety";
}

export interface MutationReceipt {
  revision: Revision;
  checkpointId: CheckpointId;
  changedPaths: ProjectPath[];
}
