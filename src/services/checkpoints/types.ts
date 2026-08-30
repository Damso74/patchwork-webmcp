import type {
  CheckpointId,
  Revision,
  WorkspaceSnapshot,
} from "../../domain/workspace/types";

export type CheckpointKind = "automatic" | "manual" | "restore-safety";

export interface Checkpoint {
  id: CheckpointId;
  projectId: string;
  kind: CheckpointKind;
  label: string;
  sourceRevision: Revision;
  snapshot: WorkspaceSnapshot;
  createdAt: string;
}
