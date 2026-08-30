import { failure, success, type Result } from "./errors";
import { WORKSPACE_LIMITS } from "./limits";
import { getExtension, parsePathPrefix, parseProjectPath } from "./paths";
import type { FileSummary, ReadFile, WorkspaceState } from "./types";

export const listWorkspaceFiles = (
  state: WorkspaceState,
  rawPrefix = "",
): Result<FileSummary[]> => {
  const prefix = parsePathPrefix(rawPrefix);
  if (!prefix.ok) return prefix;

  return success(
    Object.values(state.files)
      .filter((file) => file.path.startsWith(prefix.value))
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((file) => ({
        path: file.path,
        sizeBytes: file.sizeBytes,
        extension: getExtension(file.path),
      })),
  );
};

export const readWorkspaceFiles = (
  state: WorkspaceState,
  rawPaths: string[],
): Result<ReadFile[]> => {
  if (
    rawPaths.length === 0 ||
    rawPaths.length > WORKSPACE_LIMITS.maxReadBatchFiles
  ) {
    return failure({
      code: "BATCH_TOO_LARGE",
      message: `Read between 1 and ${WORKSPACE_LIMITS.maxReadBatchFiles} files at a time.`,
      retryable: false,
    });
  }

  const result: ReadFile[] = [];
  let totalBytes = 0;
  const seen = new Set<string>();

  for (const rawPath of rawPaths) {
    const parsed = parseProjectPath(rawPath);
    if (!parsed.ok) return parsed;
    if (seen.has(parsed.value)) {
      return failure({
        code: "INVALID_PATH",
        message: "Duplicate paths are not allowed.",
        path: rawPath,
        retryable: false,
      });
    }
    seen.add(parsed.value);
    const file = state.files[parsed.value];
    if (!file) {
      return failure({
        code: "FILE_NOT_FOUND",
        message: "The requested file does not exist.",
        path: rawPath,
        retryable: false,
      });
    }
    totalBytes += file.sizeBytes;
    if (totalBytes > WORKSPACE_LIMITS.maxReadResultBytes) {
      return failure({
        code: "BATCH_TOO_LARGE",
        message: "The requested read exceeds the maximum result size.",
        retryable: false,
        suggestion: "Read fewer files in one request.",
      });
    }
    result.push({
      path: file.path,
      content: file.content,
      sizeBytes: file.sizeBytes,
      revision: state.revision,
    });
  }

  return success(result);
};
