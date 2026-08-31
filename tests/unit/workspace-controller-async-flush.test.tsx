import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  MutationReceipt,
  ProjectPath,
  Result,
  Revision,
  WorkspaceState,
} from "../../src/domain/workspace";
import type { WorkspaceFacade } from "../../src/services/persistence";

type WriteInput = Parameters<WorkspaceFacade["writeFiles"]>[0];

const facadeHarness = vi.hoisted(() => {
  let initialState: WorkspaceState;
  let state: WorkspaceState;
  let subscriber: ((next: WorkspaceState) => void) | null = null;
  const checkpointSourceRevisions: number[] = [];
  const pendingCommits: Array<{
    input: WriteInput;
    resolve: (result: Result<MutationReceipt>) => void;
  }> = [];

  const writeFiles = vi.fn(
    (input: WriteInput) =>
      new Promise<Result<MutationReceipt>>((resolve) => {
        pendingCommits.push({ input, resolve });
      }),
  );

  const facade = {
    ready: () => Promise.resolve(),
    getState: () => structuredClone(state),
    subscribe(listener: (next: WorkspaceState) => void) {
      subscriber = listener;
      return () => {
        if (subscriber === listener) subscriber = null;
      };
    },
    getActivities: async () => ({ ok: true as const, value: [] }),
    listCheckpoints: async () => ({ ok: true as const, value: [] }),
    writeFiles,
  };

  return {
    initialize(next: WorkspaceState) {
      initialState = structuredClone(next);
      state = structuredClone(next);
      return facade;
    },
    reset() {
      state = structuredClone(initialState);
      subscriber = null;
      checkpointSourceRevisions.splice(0);
      pendingCommits.splice(0);
      writeFiles.mockClear();
    },
    commitNext() {
      const pending = pendingCommits.shift();
      if (!pending) throw new Error("No pending workspace write to commit.");
      const write = pending.input.writes[0];
      const path = write.path as ProjectPath;
      checkpointSourceRevisions.push(Number(state.revision));
      const revision = (Number(state.revision) + 1) as Revision;
      state = {
        ...state,
        revision,
        files: {
          ...state.files,
          [path]: {
            ...state.files[path],
            path,
            content: write.content,
            sizeBytes: new TextEncoder().encode(write.content).byteLength,
          },
        },
      };
      subscriber?.(structuredClone(state));
      pending.resolve({
        ok: true,
        value: {
          revision,
          checkpointId:
            `checkpoint-${revision}` as MutationReceipt["checkpointId"],
          changedPaths: [path],
        },
      });
    },
    getState: () => structuredClone(state),
    getCheckpointSourceRevisions: () => [...checkpointSourceRevisions],
    writeFiles,
  };
});

vi.mock("../../src/services/persistence/workspaceFacade", () => ({
  createWorkspaceFacade: (options: { initialWorkspace: WorkspaceState }) =>
    facadeHarness.initialize(options.initialWorkspace),
}));

import { useWorkspaceController } from "../../src/components/workspace/useWorkspaceController";

describe("workspace controller async edit flush", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    facadeHarness.reset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("preserves and persists a newer edit while the previous flush is in flight", async () => {
    const { result } = renderHook(() => useWorkspaceController());
    await act(async () => Promise.resolve());

    act(() => result.current.updateActiveFile("edit A"));
    act(() => vi.advanceTimersByTime(450));
    await act(async () => Promise.resolve());
    expect(facadeHarness.writeFiles).toHaveBeenCalledTimes(1);
    expect(facadeHarness.writeFiles.mock.calls[0][0]).toMatchObject({
      writes: [{ path: "src/App.tsx", content: "edit A" }],
      expectedRevision: 0,
      origin: "ui",
    });

    act(() => result.current.updateActiveFile("edit B"));
    act(() => vi.advanceTimersByTime(450));
    await act(async () => Promise.resolve());
    expect(facadeHarness.writeFiles).toHaveBeenCalledTimes(1);

    await act(async () => {
      facadeHarness.commitNext();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(facadeHarness.writeFiles).toHaveBeenCalledTimes(2);
    expect(facadeHarness.writeFiles.mock.calls[1][0]).toMatchObject({
      writes: [{ path: "src/App.tsx", content: "edit B" }],
      expectedRevision: 1,
      origin: "ui",
    });

    await act(async () => {
      facadeHarness.commitNext();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(facadeHarness.getState().files["src/App.tsx"].content).toBe(
      "edit B",
    );
    expect(result.current.files["/src/App.tsx"]).toBe("edit B");
    expect(result.current.revision).toBe(2);
    expect(result.current.saveState).toBe("saved");
    expect(facadeHarness.getCheckpointSourceRevisions()).toEqual([0, 1]);

    act(() => vi.advanceTimersByTime(450));
    await act(async () => Promise.resolve());
    expect(facadeHarness.writeFiles).toHaveBeenCalledTimes(2);
  });
});
