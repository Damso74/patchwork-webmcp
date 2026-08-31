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
type ResetInput = Parameters<WorkspaceFacade["resetDemo"]>[0];

const facadeHarness = vi.hoisted(() => {
  let initialState: WorkspaceState;
  let state: WorkspaceState;
  let subscriber: ((next: WorkspaceState) => void) | null = null;
  const pendingWrites: Array<{
    input: WriteInput;
    resolve: (result: Result<MutationReceipt>) => void;
  }> = [];

  const writeFiles = vi.fn(
    (input: WriteInput) =>
      new Promise<Result<MutationReceipt>>((resolve) => {
        pendingWrites.push({ input, resolve });
      }),
  );

  const resetDemo = vi.fn(async (_input: ResetInput) => {
    const revision = (Number(state.revision) + 1) as Revision;
    state = {
      ...structuredClone(initialState),
      revision,
      updatedAt: new Date().toISOString(),
    };
    subscriber?.(structuredClone(state));
    return {
      ok: true as const,
      value: {
        revision,
        checkpointId: `reset-${revision}` as MutationReceipt["checkpointId"],
        changedPaths: Object.keys(state.files) as ProjectPath[],
      },
    };
  });

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
    resetDemo,
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
      pendingWrites.splice(0);
      writeFiles.mockClear();
      resetDemo.mockClear();
    },
    resolveNextWrite() {
      const pending = pendingWrites.shift();
      if (!pending) throw new Error("No pending workspace write to resolve.");
      const write = pending.input.writes[0];
      const path = write.path as ProjectPath;
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
    rejectNextWrite() {
      const pending = pendingWrites.shift();
      if (!pending) throw new Error("No pending workspace write to reject.");
      pending.resolve({
        ok: false,
        error: {
          code: "PERSISTENCE_FAILED",
          message: "The test write failed before committing.",
          retryable: true,
        },
      });
    },
    getInitialState: () => structuredClone(initialState),
    getState: () => structuredClone(state),
    writeFiles,
    resetDemo,
  };
});

vi.mock("../../src/services/persistence/workspaceFacade", () => ({
  createWorkspaceFacade: (options: { initialWorkspace: WorkspaceState }) =>
    facadeHarness.initialize(options.initialWorkspace),
}));

import { useWorkspaceController } from "../../src/components/workspace/useWorkspaceController";

describe("workspace controller write races", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    facadeHarness.reset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("retries a newer edit after the in-flight write fails without weakening its revision", async () => {
    const { result } = renderHook(() => useWorkspaceController());
    await act(async () => Promise.resolve());

    act(() => result.current.updateActiveFile("edit A"));
    await act(async () => {
      vi.advanceTimersByTime(450);
      await Promise.resolve();
    });
    expect(facadeHarness.writeFiles).toHaveBeenCalledTimes(1);

    act(() => result.current.updateActiveFile("edit B"));
    await act(async () => {
      vi.advanceTimersByTime(450);
      await Promise.resolve();
    });
    expect(facadeHarness.writeFiles).toHaveBeenCalledTimes(1);

    await act(async () => {
      facadeHarness.rejectNextWrite();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.saveState).toBe("memory");

    await act(async () => {
      vi.advanceTimersByTime(449);
      await Promise.resolve();
    });
    expect(facadeHarness.writeFiles).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(facadeHarness.writeFiles).toHaveBeenCalledTimes(2);
    expect(facadeHarness.writeFiles.mock.calls[1][0]).toMatchObject({
      writes: [{ path: "src/App.tsx", content: "edit B" }],
      expectedRevision: 0,
      origin: "ui",
    });

    await act(async () => {
      facadeHarness.resolveNextWrite();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.files["/src/App.tsx"]).toBe("edit B");
    expect(result.current.revision).toBe(1);
    expect(result.current.saveState).toBe("saved");

    await act(async () => {
      vi.advanceTimersByTime(900);
      await Promise.resolve();
    });
    expect(facadeHarness.writeFiles).toHaveBeenCalledTimes(2);
  });

  it("waits for the full edit drain before resetting from the latest revision", async () => {
    const initialContent =
      facadeHarness.getInitialState().files["src/App.tsx"].content;
    const { result } = renderHook(() => useWorkspaceController());
    await act(async () => Promise.resolve());

    act(() => result.current.updateActiveFile("edit A"));
    await act(async () => {
      vi.advanceTimersByTime(450);
      await Promise.resolve();
    });
    act(() => result.current.updateActiveFile("edit B"));
    await act(async () => {
      vi.advanceTimersByTime(450);
      await Promise.resolve();
    });

    let resetPromise!: Promise<boolean>;
    act(() => {
      resetPromise = result.current.resetDemo();
    });
    expect(facadeHarness.resetDemo).not.toHaveBeenCalled();

    await act(async () => {
      facadeHarness.resolveNextWrite();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(facadeHarness.writeFiles).toHaveBeenCalledTimes(2);
    expect(facadeHarness.writeFiles.mock.calls[1][0]).toMatchObject({
      writes: [{ path: "src/App.tsx", content: "edit B" }],
      expectedRevision: 1,
      origin: "ui",
    });
    expect(facadeHarness.resetDemo).not.toHaveBeenCalled();

    await act(async () => {
      facadeHarness.resolveNextWrite();
      await resetPromise;
    });
    expect(facadeHarness.resetDemo).toHaveBeenCalledTimes(1);
    expect(facadeHarness.resetDemo).toHaveBeenCalledWith({
      expectedRevision: 2,
      origin: "ui",
    });
    expect(facadeHarness.getState().revision).toBe(3);
    expect(result.current.revision).toBe(3);
    expect(result.current.files["/src/App.tsx"]).toBe(initialContent);
    expect(result.current.saveState).toBe("saved");
  });
});
