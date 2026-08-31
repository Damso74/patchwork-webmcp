import { describe, expect, it } from "vitest";
import { toActivityItem } from "../../src/components/workspace/activityPresentation";
import type { ActivityEntry } from "../../src/domain/workspace/types";

const activity = (overrides: Partial<ActivityEntry> = {}): ActivityEntry =>
  ({
    id: "activity-1",
    projectId: "patchwork-landing",
    type: "files_written",
    origin: "webmcp",
    revision: 3,
    paths: ["src/App.tsx", "src/styles.css"],
    summary: "Updated 2 files.",
    createdAt: "2026-08-31T09:00:00.000Z",
    ...overrides,
  }) as ActivityEntry;

describe("activity presentation", () => {
  it("keeps the WebMCP operation, paths, revision transition and checkpoint proof", () => {
    expect(toActivityItem(activity())).toMatchObject({
      action: "Site tool activity",
      origin: "webmcp",
      type: "files_written",
      tool: "write_files",
      paths: ["src/App.tsx", "src/styles.css"],
      previousRevision: 2,
      revision: 3,
      checkpointed: true,
      tone: "success",
    });
  });

  it("does not describe a manual checkpoint as a checkpointed mutation", () => {
    expect(
      toActivityItem(
        activity({
          type: "checkpoint_created",
          origin: "ui",
          revision: 3,
          paths: [],
          summary: "Created checkpoint Before redesign.",
        }),
      ),
    ).toMatchObject({
      tool: "create_checkpoint",
      previousRevision: 3,
      revision: 3,
      checkpointed: false,
    });
  });

  it("marks explicit deletion activity as a warning", () => {
    expect(
      toActivityItem(
        activity({
          type: "file_deleted",
          paths: ["src/unused.ts"],
          revision: 1,
        }),
      ),
    ).toMatchObject({
      tool: "delete_file",
      previousRevision: 0,
      checkpointed: true,
      tone: "warning",
    });
  });
});
