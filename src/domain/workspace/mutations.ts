import { failure, success, type Result } from "./errors";
import { WORKSPACE_LIMITS, utf8Size } from "./limits";
import { parseProjectPath } from "./paths";
import type {
  ActivityEntry,
  MutationPlan,
  ProjectPath,
  Revision,
  StarterId,
  WorkspaceCommand,
  WorkspaceFile,
  WorkspaceSnapshot,
  WorkspaceState,
} from "./types";

interface MutationContext {
  now: string;
  newId: () => string;
}

interface CreateWorkspaceInput {
  projectId: string;
  starterId: StarterId;
  files: Record<string, string>;
  activePath?: string | null;
  now: string;
}

const asRevision = (value: number): Revision => value as Revision;

export const snapshotWorkspace = (
  state: WorkspaceState,
): WorkspaceSnapshot => ({
  starterId: state.starterId,
  activePath: state.activePath,
  files: Object.values(state.files)
    .sort((a, b) => a.path.localeCompare(b.path))
    .map(({ path, content }) => ({ path, content })),
});

const validateFiles = (
  files: Array<{ path: string; content: string }>,
  now: string,
): Result<Record<string, WorkspaceFile>> => {
  if (files.length > WORKSPACE_LIMITS.maxFiles) {
    return failure({
      code: "TOO_MANY_FILES",
      message: `A workspace can contain at most ${WORKSPACE_LIMITS.maxFiles} files.`,
      retryable: false,
    });
  }

  const validated: Record<string, WorkspaceFile> = {};
  let workspaceBytes = 0;
  for (const candidate of files) {
    const parsed = parseProjectPath(candidate.path);
    if (!parsed.ok) return parsed;
    if (validated[parsed.value]) {
      return failure({
        code: "PATH_COLLISION",
        message: "Duplicate file path.",
        path: candidate.path,
        retryable: false,
      });
    }
    if (typeof candidate.content !== "string") {
      return failure({
        code: "FILE_TOO_LARGE",
        message: "File content must be text.",
        path: candidate.path,
        retryable: false,
      });
    }
    const sizeBytes = utf8Size(candidate.content);
    if (sizeBytes > WORKSPACE_LIMITS.maxFileBytes) {
      return failure({
        code: "FILE_TOO_LARGE",
        message: `A file cannot exceed ${WORKSPACE_LIMITS.maxFileBytes} bytes.`,
        path: candidate.path,
        retryable: false,
      });
    }
    workspaceBytes += sizeBytes;
    if (workspaceBytes > WORKSPACE_LIMITS.maxWorkspaceBytes) {
      return failure({
        code: "WORKSPACE_TOO_LARGE",
        message: `The workspace cannot exceed ${WORKSPACE_LIMITS.maxWorkspaceBytes} bytes.`,
        retryable: false,
      });
    }
    validated[parsed.value] = {
      path: parsed.value,
      content: candidate.content,
      sizeBytes,
      updatedAt: now,
    };
  }
  return success(validated);
};

export const createWorkspaceState = (
  input: CreateWorkspaceInput,
): Result<WorkspaceState> => {
  if (!input.projectId.trim()) {
    return failure({
      code: "INVALID_PATH",
      message: "Project id cannot be empty.",
      field: "projectId",
      retryable: false,
    });
  }
  const files = validateFiles(
    Object.entries(input.files).map(([path, content]) => ({ path, content })),
    input.now,
  );
  if (!files.ok) return files;

  let activePath: ProjectPath | null = null;
  if (input.activePath) {
    const parsed = parseProjectPath(input.activePath);
    if (!parsed.ok) return parsed;
    if (!files.value[parsed.value]) {
      return failure({
        code: "FILE_NOT_FOUND",
        message: "The active file must exist in the workspace.",
        path: input.activePath,
        retryable: false,
      });
    }
    activePath = parsed.value;
  } else {
    activePath =
      Object.values(files.value).sort((a, b) => a.path.localeCompare(b.path))[0]
        ?.path ?? null;
  }

  return success({
    schemaVersion: 1,
    projectId: input.projectId,
    starterId: input.starterId,
    revision: asRevision(0),
    activePath,
    files: files.value,
    createdAt: input.now,
    updatedAt: input.now,
  });
};

const stateFromSnapshot = (
  current: WorkspaceState,
  snapshot: WorkspaceSnapshot,
  now: string,
): Result<Pick<WorkspaceState, "starterId" | "activePath" | "files">> => {
  if (snapshot.starterId !== current.starterId) {
    return failure({
      code: "PERSISTENCE_FAILED",
      message: "The checkpoint does not belong to the active starter.",
      retryable: false,
      suggestion: "Choose a checkpoint created for the current project.",
    });
  }
  const files = validateFiles(snapshot.files, now);
  if (!files.ok) return files;
  let activePath = snapshot.activePath;
  if (activePath && !files.value[activePath]) activePath = null;
  activePath ??=
    Object.values(files.value).sort((a, b) => a.path.localeCompare(b.path))[0]
      ?.path ?? null;
  return success({
    starterId: snapshot.starterId ?? current.starterId,
    activePath,
    files: files.value,
  });
};

const revisionConflict = (
  current: WorkspaceState,
  expectedRevision?: number,
): Result<never> | null => {
  if (expectedRevision === undefined || expectedRevision === current.revision)
    return null;
  return failure({
    code: "REVISION_CONFLICT",
    message: `Expected revision ${expectedRevision}, but the workspace is at revision ${current.revision}.`,
    currentRevision: current.revision,
    retryable: true,
    suggestion: "Read the latest workspace state before retrying the mutation.",
  });
};

const totalWorkspaceBytes = (files: Record<string, WorkspaceFile>): number =>
  Object.values(files).reduce((total, file) => total + file.sizeBytes, 0);

const makeActivity = (
  current: WorkspaceState,
  context: MutationContext,
  command: WorkspaceCommand,
  revision: Revision,
  paths: ProjectPath[],
): ActivityEntry => {
  const details = (() => {
    switch (command.kind) {
      case "write":
        return {
          type: "files_written" as const,
          summary: `Updated ${paths.length} file${paths.length === 1 ? "" : "s"}.`,
        };
      case "move":
        return {
          type: "file_moved" as const,
          summary: `Moved ${command.from} to ${command.to}.`,
        };
      case "delete":
        return {
          type: "file_deleted" as const,
          summary: `Deleted ${command.path}.`,
        };
      case "restore":
        return {
          type: "checkpoint_restored" as const,
          summary: `Restored checkpoint ${command.checkpointId}.`,
        };
      case "reset":
        return {
          type: "demo_reset" as const,
          summary: `Reset the ${command.snapshot.starterId} demo.`,
        };
    }
  })();

  return {
    id: context.newId(),
    projectId: current.projectId,
    type: details.type,
    origin: command.origin,
    revision,
    paths,
    summary: details.summary,
    createdAt: context.now,
  };
};

export const planWorkspaceMutation = (
  current: WorkspaceState,
  command: WorkspaceCommand,
  context: MutationContext,
): Result<MutationPlan> => {
  const conflict = revisionConflict(current, command.expectedRevision);
  if (conflict) return conflict;

  const nextRevision = asRevision(current.revision + 1);
  const files = { ...current.files };
  let activePath = current.activePath;
  let starterId = current.starterId;
  let changedPaths: ProjectPath[] = [];

  if (command.kind === "write") {
    if (
      command.writes.length === 0 ||
      command.writes.length > WORKSPACE_LIMITS.maxWriteBatchFiles
    ) {
      return failure({
        code: "BATCH_TOO_LARGE",
        message: `Write between 1 and ${WORKSPACE_LIMITS.maxWriteBatchFiles} files at a time.`,
        retryable: false,
      });
    }

    const staged: Array<{
      path: ProjectPath;
      content: string;
      sizeBytes: number;
    }> = [];
    const seen = new Set<string>();
    let batchBytes = 0;
    for (const write of command.writes) {
      const parsed = parseProjectPath(write.path);
      if (!parsed.ok) return parsed;
      if (seen.has(parsed.value)) {
        return failure({
          code: "PATH_COLLISION",
          message: "A write batch cannot repeat a path.",
          path: write.path,
          retryable: false,
        });
      }
      seen.add(parsed.value);
      if (typeof write.content !== "string") {
        return failure({
          code: "FILE_TOO_LARGE",
          message: "File content must be text.",
          path: write.path,
          retryable: false,
        });
      }
      const sizeBytes = utf8Size(write.content);
      if (sizeBytes > WORKSPACE_LIMITS.maxFileBytes) {
        return failure({
          code: "FILE_TOO_LARGE",
          message: "File exceeds the per-file size limit.",
          path: write.path,
          retryable: false,
        });
      }
      batchBytes += sizeBytes;
      if (batchBytes > WORKSPACE_LIMITS.maxWriteBatchBytes) {
        return failure({
          code: "BATCH_TOO_LARGE",
          message: "Write batch exceeds the byte limit.",
          retryable: false,
        });
      }
      staged.push({ path: parsed.value, content: write.content, sizeBytes });
    }

    if (staged.every((write) => files[write.path]?.content === write.content)) {
      return failure({
        code: "NO_CHANGES",
        message: "The write batch does not change the workspace.",
        retryable: false,
      });
    }
    for (const write of staged) {
      files[write.path] = { ...write, updatedAt: context.now };
      changedPaths.push(write.path);
    }
    if (Object.keys(files).length > WORKSPACE_LIMITS.maxFiles) {
      return failure({
        code: "TOO_MANY_FILES",
        message: "The write would exceed the workspace file limit.",
        retryable: false,
      });
    }
    if (totalWorkspaceBytes(files) > WORKSPACE_LIMITS.maxWorkspaceBytes) {
      return failure({
        code: "WORKSPACE_TOO_LARGE",
        message: "The write would exceed the workspace size limit.",
        retryable: false,
      });
    }
    activePath ??= staged[0]?.path ?? null;
  } else if (command.kind === "move") {
    const from = parseProjectPath(command.from);
    if (!from.ok) return from;
    const to = parseProjectPath(command.to);
    if (!to.ok) return to;
    const source = files[from.value];
    if (!source)
      return failure({
        code: "FILE_NOT_FOUND",
        message: "The source file does not exist.",
        path: command.from,
        retryable: false,
      });
    if (files[to.value])
      return failure({
        code: "PATH_COLLISION",
        message: "The destination file already exists.",
        path: command.to,
        retryable: false,
      });
    delete files[from.value];
    files[to.value] = { ...source, path: to.value, updatedAt: context.now };
    if (activePath === from.value) activePath = to.value;
    changedPaths = [from.value, to.value];
  } else if (command.kind === "delete") {
    const path = parseProjectPath(command.path);
    if (!path.ok) return path;
    if (!files[path.value])
      return failure({
        code: "FILE_NOT_FOUND",
        message: "The file does not exist.",
        path: command.path,
        retryable: false,
      });
    delete files[path.value];
    if (activePath === path.value) {
      activePath =
        Object.values(files).sort((a, b) => a.path.localeCompare(b.path))[0]
          ?.path ?? null;
    }
    changedPaths = [path.value];
  } else {
    const restored = stateFromSnapshot(current, command.snapshot, context.now);
    if (!restored.ok) return restored;
    starterId = restored.value.starterId;
    activePath = restored.value.activePath;
    changedPaths = Array.from(
      new Set([
        ...Object.keys(current.files),
        ...Object.keys(restored.value.files),
      ]),
    )
      .sort()
      .filter(
        (path) =>
          current.files[path]?.content !== restored.value.files[path]?.content,
      ) as ProjectPath[];
    if (
      changedPaths.length === 0 &&
      activePath === current.activePath &&
      starterId === current.starterId
    ) {
      return failure({
        code: "NO_CHANGES",
        message: "The snapshot already matches the workspace.",
        retryable: false,
      });
    }
    Object.keys(files).forEach((path) => delete files[path]);
    Object.assign(files, restored.value.files);
  }

  const next: WorkspaceState = {
    ...current,
    starterId,
    revision: nextRevision,
    activePath,
    files,
    updatedAt: context.now,
  };

  return success({
    previous: current,
    next,
    beforeSnapshot: snapshotWorkspace(current),
    activity: makeActivity(
      current,
      context,
      command,
      nextRevision,
      changedPaths,
    ),
    changedPaths,
    checkpointKind: command.kind === "restore" ? "restore-safety" : "automatic",
  });
};
