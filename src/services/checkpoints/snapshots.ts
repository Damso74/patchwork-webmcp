import type {
  CheckpointId,
  MutationOrigin,
  WorkspaceState,
} from "../../domain/workspace/types";
import { snapshotWorkspace } from "../../domain/workspace/mutations";
import type { Checkpoint, CheckpointKind } from "./types";

interface CreateCheckpointInput {
  state: WorkspaceState;
  id: string;
  now: string;
  kind: CheckpointKind;
  label?: string;
  origin?: MutationOrigin;
}

const defaultLabel = (kind: CheckpointKind, revision: number): string => {
  if (kind === "manual") return `Checkpoint at revision ${revision}`;
  if (kind === "restore-safety")
    return `Before restore at revision ${revision}`;
  return `Before revision ${revision + 1}`;
};

export const createCheckpointRecord = (
  input: CreateCheckpointInput,
): Checkpoint => ({
  id: input.id as CheckpointId,
  projectId: input.state.projectId,
  kind: input.kind,
  label:
    input.label?.trim().slice(0, 80) ||
    defaultLabel(input.kind, input.state.revision),
  sourceRevision: input.state.revision,
  snapshot: snapshotWorkspace(input.state),
  createdAt: input.now,
});
