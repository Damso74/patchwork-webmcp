import type {
  ActivityEntry,
  ActivityType,
  MutationOrigin,
} from "../../domain/workspace/types";

export type ActivityToolName =
  | "write_files"
  | "move_file"
  | "delete_file"
  | "create_checkpoint"
  | "restore_checkpoint"
  | "reset_demo";

export interface ActivityItem {
  id: string;
  action: string;
  detail: string;
  revision: number;
  previousRevision: number;
  timestamp: string;
  origin: MutationOrigin;
  type: ActivityType;
  paths: string[];
  tool: ActivityToolName;
  checkpointed: boolean;
  tone?: "success" | "warning";
}

const activityToolNames: Record<ActivityType, ActivityToolName> = {
  files_written: "write_files",
  file_moved: "move_file",
  file_deleted: "delete_file",
  checkpoint_created: "create_checkpoint",
  checkpoint_restored: "restore_checkpoint",
  demo_reset: "reset_demo",
};

export const toActivityItem = (item: ActivityEntry): ActivityItem => ({
  id: item.id,
  action:
    item.origin === "webmcp"
      ? "Site tool activity"
      : item.type.replaceAll("_", " "),
  detail: item.summary,
  revision: item.revision,
  previousRevision:
    item.type === "checkpoint_created"
      ? item.revision
      : Math.max(0, item.revision - 1),
  timestamp: item.createdAt,
  origin: item.origin,
  type: item.type,
  paths: [...item.paths],
  tool: activityToolNames[item.type],
  checkpointed: item.type !== "checkpoint_created",
  tone: item.type === "file_deleted" ? "warning" : "success",
});
