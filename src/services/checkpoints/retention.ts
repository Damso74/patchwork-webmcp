import { WORKSPACE_LIMITS } from "../../domain/workspace/limits";
import type { Checkpoint } from "./types";

export const checkpointsToPrune = (checkpoints: Checkpoint[]): Checkpoint[] => {
  const automatic = checkpoints
    .filter((checkpoint) => checkpoint.kind !== "manual")
    .sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    );
  return automatic.slice(
    0,
    Math.max(0, automatic.length - WORKSPACE_LIMITS.maxAutomaticCheckpoints),
  );
};

export const canCreateManualCheckpoint = (checkpoints: Checkpoint[]): boolean =>
  checkpoints.filter((checkpoint) => checkpoint.kind === "manual").length <
  WORKSPACE_LIMITS.maxManualCheckpoints;
