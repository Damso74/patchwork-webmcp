import { deleteDB, openDB, type IDBPDatabase } from "idb";
import type { PatchworkDbSchema } from "./schema";

export const DEFAULT_DATABASE_NAME = "patchwork";

export const openPatchworkDatabase = (
  name = DEFAULT_DATABASE_NAME,
): Promise<IDBPDatabase<PatchworkDbSchema>> =>
  openDB<PatchworkDbSchema>(name, 1, {
    upgrade(database) {
      database.createObjectStore("workspaces", { keyPath: "projectId" });
      const checkpoints = database.createObjectStore("checkpoints", {
        keyPath: "id",
      });
      checkpoints.createIndex("by-project", "projectId");
      const activities = database.createObjectStore("activities", {
        keyPath: "id",
      });
      activities.createIndex("by-project", "projectId");
    },
  });

export const deletePatchworkDatabase = (
  name = DEFAULT_DATABASE_NAME,
): Promise<void> => deleteDB(name);
