import { WORKSPACE_LIMITS, type Result } from "../domain/workspace";
import type {
  ToolEnvelope,
  ToolFactoryContext,
  WebMCPToolDefinition,
} from "./types";
import { schemas } from "./schemas";

const invalidInput = (
  tool: string,
  revision: number,
  message: string,
): ToolEnvelope => ({
  ok: false,
  tool,
  revision,
  error: {
    code: "INVALID_INPUT",
    message,
    retryable: false,
    suggestion:
      "Use the tool input schema and retry with only the documented fields.",
  },
  warnings: [],
  timestamp: new Date().toISOString(),
});

const createEnvelopeFactory = (context: ToolFactoryContext) => {
  const now = context.now ?? (() => new Date().toISOString());

  const ok = <T>(
    tool: string,
    data: T,
    warnings: string[] = [],
  ): ToolEnvelope<T> => ({
    ok: true,
    tool,
    revision: Number(context.facade.getState().revision),
    data,
    warnings,
    timestamp: now(),
  });

  const fromResult = <T>(
    tool: string,
    result: Result<T>,
    warnings: string[] = [],
  ): ToolEnvelope<T> => {
    if (result.ok) return ok(tool, result.value, warnings);
    return {
      ok: false,
      tool,
      revision: Number(context.facade.getState().revision),
      error: result.error,
      warnings,
      timestamp: now(),
    };
  };

  return { ok, fromResult };
};

const roleForPath = (path: string): string => {
  if (/main\.(t|j)sx?$/.test(path)) return "application entry point";
  if (/App\.(t|j)sx?$/.test(path)) return "primary UI component";
  if (/\.css$/.test(path)) return "stylesheet";
  if (/\.json$/.test(path)) return "configuration or data";
  if (/\.md$/.test(path)) return "documentation";
  return "project source";
};

const stringValue = (
  input: Record<string, unknown>,
  key: string,
): string | undefined =>
  typeof input[key] === "string" ? input[key] : undefined;

const numberValue = (
  input: Record<string, unknown>,
  key: string,
): number | undefined =>
  Number.isInteger(input[key]) && Number(input[key]) >= 0
    ? Number(input[key])
    : undefined;

export const createPatchworkTools = (
  context: ToolFactoryContext,
): WebMCPToolDefinition[] => {
  const { facade, getPreview } = context;
  const envelope = createEnvelopeFactory(context);
  const tool = (
    name: string,
    title: string,
    description: string,
    readOnly: boolean,
    execute: WebMCPToolDefinition["execute"],
    untrustedContentHint = false,
  ): WebMCPToolDefinition => ({
    name,
    title,
    description,
    inputSchema: schemas[name],
    annotations: { readOnlyHint: readOnly, untrustedContentHint },
    execute,
  });

  return [
    tool(
      "get_workspace_context",
      "Get workspace context",
      "Inspect Patchwork before planning work. Returns the active starter, revision, selected file, file summary, latest checkpoint, preview status, and enforced limits. This is read-only.",
      true,
      async () => {
        const state = facade.getState();
        const checkpoints = await facade.listCheckpoints();
        if (!checkpoints.ok)
          return envelope.fromResult("get_workspace_context", checkpoints);
        return envelope.ok("get_workspace_context", {
          starter: state.starterId,
          projectId: state.projectId,
          revision: state.revision,
          activeFile: state.activePath,
          files: Object.values(state.files).map(({ path, sizeBytes }) => ({
            path,
            sizeBytes,
            role: roleForPath(path),
          })),
          lastCheckpoint: checkpoints.value[0]
            ? {
                id: checkpoints.value[0].id,
                label: checkpoints.value[0].label,
                kind: checkpoints.value[0].kind,
                sourceRevision: checkpoints.value[0].sourceRevision,
                createdAt: checkpoints.value[0].createdAt,
              }
            : null,
          preview: getPreview(),
          limits: WORKSPACE_LIMITS,
        });
      },
      true,
    ),
    tool(
      "list_files",
      "List project files",
      "List canonical text file paths, sizes, extensions, and roles. Use before read_files when you need to discover the project structure. This is read-only.",
      true,
      async (input) => {
        const prefix = stringValue(input, "prefix") ?? "";
        const result = facade.listFiles(prefix);
        if (!result.ok) return envelope.fromResult("list_files", result);
        return envelope.ok(
          "list_files",
          result.value.map((file) => ({
            ...file,
            role: roleForPath(file.path),
          })),
        );
      },
    ),
    tool(
      "read_files",
      "Read project files",
      `Read an explicit batch of up to ${WORKSPACE_LIMITS.maxReadBatchFiles} validated text files. Use after list_files and before editing. Returns the revision observed with each file and never mutates state.`,
      true,
      async (input) => {
        if (
          !Array.isArray(input.paths) ||
          input.paths.some((value) => typeof value !== "string")
        ) {
          return invalidInput(
            "read_files",
            Number(facade.getState().revision),
            "paths must be an array of project-relative strings.",
          );
        }
        return envelope.fromResult(
          "read_files",
          facade.readFiles(input.paths as string[]),
        );
      },
      true,
    ),
    tool(
      "write_files",
      "Write project files atomically",
      `Create or replace up to ${WORKSPACE_LIMITS.maxWriteBatchFiles} text files as one atomic change. Use for complete file contents after reading the current revision. Patchwork validates the entire batch, creates exactly one automatic checkpoint, persists once, and increments the revision once; an invalid item changes nothing.`,
      false,
      async (input) => {
        if (!Array.isArray(input.writes)) {
          return invalidInput(
            "write_files",
            Number(facade.getState().revision),
            "writes must be an array of path/content objects.",
          );
        }
        const writes = input.writes.filter(
          (value): value is { path: string; content: string } =>
            Boolean(value) &&
            typeof value === "object" &&
            typeof (value as Record<string, unknown>).path === "string" &&
            typeof (value as Record<string, unknown>).content === "string",
        );
        if (writes.length !== input.writes.length) {
          return invalidInput(
            "write_files",
            Number(facade.getState().revision),
            "Every write requires string path and content fields.",
          );
        }
        return envelope.fromResult(
          "write_files",
          await facade.writeFiles({
            writes,
            expectedRevision: numberValue(input, "expectedRevision"),
            origin: "webmcp",
          }),
        );
      },
      true,
    ),
    tool(
      "move_file",
      "Move a project file",
      "Rename or move one explicit text file after validating both canonical paths and destination collisions. Creates a checkpoint and changes the workspace atomically.",
      false,
      async (input) => {
        const from = stringValue(input, "from");
        const to = stringValue(input, "to");
        if (!from || !to)
          return invalidInput(
            "move_file",
            Number(facade.getState().revision),
            "from and to are required project-relative paths.",
          );
        return envelope.fromResult(
          "move_file",
          await facade.moveFile({
            from,
            to,
            expectedRevision: numberValue(input, "expectedRevision"),
            origin: "webmcp",
          }),
        );
      },
    ),
    tool(
      "delete_file",
      "Delete one project file",
      "Delete exactly one explicit file. Globs, directories, and recursive deletion are never accepted. Creates a checkpoint before the atomic deletion.",
      false,
      async (input) => {
        const path = stringValue(input, "path");
        if (!path)
          return invalidInput(
            "delete_file",
            Number(facade.getState().revision),
            "path is required.",
          );
        return envelope.fromResult(
          "delete_file",
          await facade.deleteFile({
            path,
            expectedRevision: numberValue(input, "expectedRevision"),
            origin: "webmcp",
          }),
        );
      },
    ),
    tool(
      "inspect_preview",
      "Inspect preview diagnostics",
      "Read the current Sandpack compilation/runtime status, diagnostics, rendered revision, and factual preview summary. It does not claim visual understanding and does not mutate state.",
      true,
      async () => envelope.ok("inspect_preview", getPreview()),
      true,
    ),
    tool(
      "create_checkpoint",
      "Create a project checkpoint",
      "Create a named or automatically named local snapshot of the current workspace without changing file content or revision. Use before a risky transformation or milestone.",
      false,
      async (input) =>
        envelope.fromResult(
          "create_checkpoint",
          await facade.createCheckpoint({
            label: stringValue(input, "label"),
            origin: "webmcp",
          }),
        ),
    ),
    tool(
      "restore_checkpoint",
      "Restore a project checkpoint",
      "Restore one explicit checkpoint by identifier. Patchwork first preserves the current state as a safety checkpoint, then restores and increments the revision once.",
      false,
      async (input) => {
        const checkpointId = stringValue(input, "checkpointId");
        if (!checkpointId)
          return invalidInput(
            "restore_checkpoint",
            Number(facade.getState().revision),
            "checkpointId is required.",
          );
        return envelope.fromResult(
          "restore_checkpoint",
          await facade.restoreCheckpoint({
            checkpointId,
            expectedRevision: numberValue(input, "expectedRevision"),
            origin: "webmcp",
          }),
        );
      },
    ),
    tool(
      "prepare_project_export",
      "Prepare project export",
      "Validate the current project for ZIP export and return the filename, revision, file manifest, total size, and warnings. This never starts a download or changes state.",
      true,
      async () =>
        envelope.fromResult(
          "prepare_project_export",
          facade.prepareProjectExport(),
        ),
    ),
  ];
};
