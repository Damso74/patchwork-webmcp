# WebMCP implementation

> Public tool contract for Patchwork. Automated and real ChatGPT test results must be recorded separately in `docs/VERIFICATION.md`; this document does not claim that an unrecorded test passed.

## Why WebMCP is load-bearing

Without WebMCP, an agent would have to infer file state from rendered controls and manipulate the application through pixels and keystrokes. With WebMCP, Patchwork exposes explicit file reads, bounded atomic mutations, revisions, checkpoints, preview diagnostics, and export preparation. The human and agent still share the same live page and the same underlying services.

Patchwork does not embed a chatbot, request an OpenAI API key, install an extension, run Codex app-server, or require a separate MCP server.

## Supported browser subset

Current ChatGPT Site Tools support requires imperative JavaScript registration in the top-level document:

```ts
if (typeof document.modelContext?.registerTool === "function") {
  await document.modelContext.registerTool({
    name: "get_workspace_context",
    description:
      "Read the current Patchwork workspace summary before choosing more specific file or preview tools.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: handlers.getWorkspaceContext,
  });
}
```

Patchwork does not use declarative form registration, which is not currently available as ChatGPT Site Tools. It does not register inside Sandpack's iframe because the built-in browser does not discover same-origin or cross-origin iframe tools.

## Registration lifecycle

1. Initialize the selected starter or restore persisted state.
2. Create the application-service facade used by both UI and tools.
3. Feature-detect `document.modelContext.registerTool`.
4. Register each stable tool name once from the top-level host document.
5. Mark Site Tools available only after registration completes.
6. On unsupported browsers, skip registration and show a quiet fallback status.

Registration must be idempotent across React Strict Mode and hot reload. The guard is scoped to the current document and must not create a second set of handlers or register from the preview iframe.

## Common result envelope

Every tool returns a stable JSON-serializable envelope:

```ts
type ToolResult<T> = {
  ok: boolean;
  tool: string;
  revision: number;
  data: T | null;
  error: {
    code: string;
    message: string;
    field?: string;
    path?: string;
    retryable: boolean;
    suggestion?: string;
    currentRevision?: number;
  } | null;
  warnings: string[];
  timestamp: string;
};
```

Results exclude secrets, stack traces, IndexedDB internals, full activity payloads, and unrelated workspace content. Error messages identify a repair action when one exists.

## Tool inventory

### `get_workspace_context`

Read-only. Use first to understand the active starter, revision, selected file, summarized files, latest checkpoint, preview status, and enforced limits.

Input: closed empty object.

No mutation, checkpoint, activity write, persistence write, or revision change is permitted.

### `list_files`

Read-only. Lists normalized path, type/extension, byte size, and a short role hint. Accepts an optional normalized prefix and never returns file contents.

Limits: at most the workspace file limit; prefix filtering must not accept traversal or absolute paths.

### `read_files`

Read-only. Reads an explicit small list of text files and returns content, byte size, and the observed revision.

Limits: at most 12 unique paths and 512 KiB total response content. Unsupported, missing, binary, sensitive, or invalid paths fail structurally. Reads never create access-log activity or otherwise alter workspace state.

### `write_files`

Mutating. Creates or replaces a validated batch atomically. It accepts 1–12 unique writes plus an optional `expectedRevision`.

All paths, extensions, content types, per-file sizes, batch bytes, total file count, and resulting workspace bytes are validated before the first persistent write. A valid mutation creates exactly one automatic pre-mutation checkpoint, commits one new revision, persists one synthetic activity entry, and returns all changed paths. Any invalid member rejects the whole batch.

### `move_file`

Mutating. Moves or renames one explicit file after validating source, destination, collision, extension, and optional expected revision. It creates one pre-mutation checkpoint and one revision. Folder recursion and globs are not supported.

### `delete_file`

Mutating. Deletes one explicit existing file. It rejects folders, globs, traversal, and ambiguous paths. It creates a pre-mutation checkpoint and records only the deleted path, never the deleted content.

### `inspect_preview`

Read-only. Returns the latest reliably available preview status, compiler/runtime errors, warnings, and a small render summary. It must distinguish “no diagnostics observed” from “visual result verified” and must not claim visual understanding.

### `create_checkpoint`

Creates an immutable snapshot without changing project files or the workspace revision. Accepts an optional bounded label and returns checkpoint ID, time, kind, and source revision. It may persist the checkpoint and record checkpoint activity; those effects are described in the tool metadata and result.

### `restore_checkpoint`

Mutating. Restores one explicit checkpoint ID after validating the snapshot. It preserves a restore-safety checkpoint of the current state when possible, persists the restored state, increments the workspace revision once, and logs the restoration.

### `prepare_project_export`

Read-only with respect to workspace content. Validates exportability and returns a proposed ZIP filename, sorted manifest, file count, byte count, and warnings. It does not start a download; browser download remains a user action.

## Schema rules

- Top-level schemas are objects with `additionalProperties: false`.
- Required fields are explicit.
- String lengths, array sizes, and enums are bounded in the schema and revalidated in the domain.
- Batch paths must be unique.
- `expectedRevision` is a non-negative integer.
- Labels are short plain strings.
- Tool names are stable and use lowercase snake case.

Schema validation is not the security boundary. Every handler passes parsed input to the same domain validation used by the UI.

## Annotations and effects

Read tools use `readOnlyHint: true`. Mutating tools do not claim to be read-only and their descriptions state their effects, checkpoint behavior, and revision behavior. `prepare_project_export` is read-only because it only computes a manifest; the separate human download action is not a tool call.

If the implemented browser type supports additional standard annotations, add only annotations that accurately describe the real handler. Never label a persisting or content-changing operation as read-only.

## Atomicity and optimistic concurrency

Mutation handlers delegate to one transaction path:

1. Compare `expectedRevision` when supplied.
2. Validate the complete request and stage the next state.
3. Create the pre-mutation checkpoint.
4. Persist checkpoint, next state, and activity coherently.
5. Publish one state update and return one new revision.

On conflict, return `REVISION_CONFLICT` with `currentRevision`, `retryable: true`, and a suggestion to re-read context before retrying. On any validation or persistence failure, do not expose a partial write.

## Repairable error vocabulary

Expected codes include:

- `INVALID_PATH`
- `UNSUPPORTED_EXTENSION`
- `SENSITIVE_PATH`
- `FILE_NOT_FOUND`
- `PATH_COLLISION`
- `FILE_TOO_LARGE`
- `BATCH_TOO_LARGE`
- `TOO_MANY_FILES`
- `WORKSPACE_TOO_LARGE`
- `READ_RESULT_TOO_LARGE`
- `REVISION_CONFLICT`
- `CHECKPOINT_NOT_FOUND`
- `NO_CHANGES`
- `PREVIEW_UNAVAILABLE`
- `PERSISTENCE_FAILED`
- `EXPORT_NOT_READY`

Messages must be useful to an agent without exposing stack traces or internal storage keys.

## Test adapter

Playwright injects a minimal `document.modelContext.registerTool` adapter before the application loads. The adapter records the definitions registered by the production integration and invokes their real `execute` functions. It must not duplicate handler or domain logic.

Integration coverage should confirm:

- Every expected tool registers exactly once.
- Schemas and annotations are present.
- Read tools leave revision, files, checkpoints, activity, and persistence unchanged.
- A valid write creates one checkpoint and one revision.
- A partially invalid batch creates no write.
- Dangerous paths are refused.
- Preview diagnostics are faithfully exposed.
- Restore reproduces the requested snapshot.
- Missing WebMCP does not break the human workflow.
- Re-registration attempts do not duplicate tools.

## Manual ChatGPT proof

Native read-only preflight evidence recorded before the full filmed mutation:

- Date: `2026-08-30`
- Environment: ChatGPT Codex in-app browser
- Model: current Codex session; the filmed run should record its exact selected model
- Live URL: `https://patchwork-webmcp.vercel.app/?demo=landing`
- Prompt: canonical Roamly prompt from `docs/DEMO_RUNBOOK.md`
- Discovered tools: `10`, registered from the top-level page
- Result: `PARTIAL PASS` — native discovery and read-only context/preview calls succeeded; the full Roamly write/checkpoint/repair sequence remains not run until rehearsal or recording

An adapter-based test is valuable automated evidence, but it must always be labeled as adapter-based and never presented as a real ChatGPT Site Tools session.

## Official references

- [OpenAI Site Tools guide](https://learn.chatgpt.com/docs/webmcp)
- [WebMCP specification](https://webmachinelearning.github.io/webmcp/)
- [Chrome WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp)
