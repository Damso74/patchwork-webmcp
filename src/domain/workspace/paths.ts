import {
  ALLOWED_EXTENSIONLESS_FILES,
  ALLOWED_TEXT_EXTENSIONS,
  FORBIDDEN_SENSITIVE_NAMES,
  WORKSPACE_LIMITS,
  utf8Size,
} from "./limits";
import { failure, success, type Result } from "./errors";
import type { ProjectPath } from "./types";

const encodedAmbiguity = /%(?:2e|2f|5c)/i;
// Matching control bytes is intentional: they are invalid in project paths.
// eslint-disable-next-line no-control-regex
const controlCharacter = /[\u0000-\u001f\u007f]/;

const pathFailure = (message: string, path: string): Result<ProjectPath> =>
  failure({
    code: "INVALID_PATH",
    message,
    path,
    retryable: false,
    suggestion: "Use a relative POSIX path such as src/App.tsx.",
  });

const extensionOf = (path: string): string => {
  const basename = path.slice(path.lastIndexOf("/") + 1);
  const dot = basename.lastIndexOf(".");
  return dot <= 0 ? "" : basename.slice(dot).toLowerCase();
};

export const parseProjectPath = (raw: string): Result<ProjectPath> => {
  if (typeof raw !== "string" || raw.length === 0)
    return pathFailure("Path cannot be empty.", String(raw));

  const path = raw.normalize("NFC");
  if (path !== raw)
    return pathFailure("Path must already use normalized Unicode (NFC).", raw);
  if (path.startsWith("/") || /^[a-z]:/i.test(path))
    return pathFailure("Absolute paths are not allowed.", path);
  if (path.includes("\\"))
    return pathFailure(
      "Backslashes are not allowed; use POSIX separators.",
      path,
    );
  if (path.includes(":") || path.includes("?") || path.includes("#"))
    return pathFailure("URL-like paths are not allowed.", path);
  if (controlCharacter.test(path))
    return pathFailure("Control characters are not allowed in paths.", path);
  if (encodedAmbiguity.test(path))
    return pathFailure(
      "Encoded path separators or traversal are not allowed.",
      path,
    );
  if (utf8Size(path) > WORKSPACE_LIMITS.maxPathBytes)
    return pathFailure("Path exceeds the maximum length.", path);

  const segments = path.split("/");
  for (const segment of segments) {
    if (
      !segment ||
      segment === "." ||
      segment === ".." ||
      segment.trim() !== segment
    ) {
      return pathFailure("Path contains an empty or ambiguous segment.", path);
    }
    if (utf8Size(segment) > WORKSPACE_LIMITS.maxSegmentBytes)
      return pathFailure("A path segment is too long.", path);
  }

  if (FORBIDDEN_SENSITIVE_NAMES.test(path)) {
    return failure({
      code: "UNSUPPORTED_FILE_TYPE",
      message: "Sensitive credential file names are not supported.",
      path,
      retryable: false,
      suggestion: "Keep secrets and environment files outside Patchwork.",
    });
  }

  const basename = segments.at(-1)!;
  if (
    !ALLOWED_EXTENSIONLESS_FILES.has(basename) &&
    !ALLOWED_TEXT_EXTENSIONS.has(extensionOf(path))
  ) {
    return failure({
      code: "UNSUPPORTED_FILE_TYPE",
      message: "Only supported text file types can be stored.",
      path,
      retryable: false,
      suggestion:
        "Use a supported source, markup, style, JSON, Markdown, text, or SVG file.",
    });
  }

  return success(path as ProjectPath);
};

export const parsePathPrefix = (raw: string): Result<string> => {
  if (raw === "") return success("");
  const candidate = raw.endsWith("/") ? raw.slice(0, -1) : raw;
  const synthetic = `${candidate}/placeholder.txt`;
  const parsed = parseProjectPath(synthetic);
  return parsed.ok ? success(`${candidate}/`) : parsed;
};

export const getExtension = extensionOf;
