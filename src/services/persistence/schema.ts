import type { DBSchema } from "idb";
import type {
  ActivityEntry,
  WorkspaceState,
} from "../../domain/workspace/types";
import type { Checkpoint } from "../checkpoints/types";

export interface PatchworkDbSchema extends DBSchema {
  workspaces: {
    key: string;
    value: WorkspaceState;
  };
  checkpoints: {
    key: string;
    value: Checkpoint;
    indexes: { "by-project": string };
  };
  activities: {
    key: string;
    value: ActivityEntry;
    indexes: { "by-project": string };
  };
}
