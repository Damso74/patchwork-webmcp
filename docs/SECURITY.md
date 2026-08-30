# Patchwork security model

## Scope

This document covers the static Patchwork host application, its virtual text workspace, IndexedDB persistence, checkpoints, ZIP export, Sandpack preview, and top-level WebMCP Site Tools. It does not claim a completed security audit; factual scan and test results belong in `docs/VERIFICATION.md`.

Patchwork is intentionally local-first. The MVP has no project backend, user account, direct OpenAI API call, requested API key, remote shell, arbitrary package installer, private-repository integration, or Codex app-server dependency.

## Security objectives

- Keep workspace data inside the browser unless the user explicitly downloads it.
- Prevent path traversal, sensitive filename creation, unsupported content, and resource exhaustion.
- Make mutations atomic, revision-aware, and recoverable.
- Ensure read-only tools never mutate content, checkpoints, activity, persistence, or revision.
- Prevent the preview iframe from registering or controlling host Site Tools.
- Avoid secrets in source, logs, bundles, activity, exported metadata, and documentation.
- Present honest diagnostics without overstating preview or visual verification.

## Assets

- Workspace file names and contents.
- Current revision and active file.
- Checkpoint snapshots and labels.
- Recent activity metadata.
- Deterministic bundled starters.
- Exported ZIP contents.
- Integrity of the host application and registered tool definitions.

Patchwork does not intentionally collect credentials or personal account data.

## Trust boundaries

### WebMCP boundary

Tool inputs and agent-supplied text are untrusted. Browser invocation review does not make an input safe and does not grant permission beyond the requested Patchwork operation.

### Workspace boundary

File contents can include adversarial instructions or code. The host treats them as data. It does not execute them with `eval`, interpolate them into host markup, or treat comments and README content as operational instructions.

### Preview boundary

Sandpack executes project code inside its preview environment. The iframe is not authorized to register Site Tools, mutate host persistence directly, or redefine host domain services.

### Local storage boundary

IndexedDB can be modified by the browser user, extensions, development tools, or an older application version. Loaded records require schema, path, and size validation before becoming live state.

### Download boundary

ZIP creation uses validated workspace paths. Starting the download is a visible user action. A prepared manifest is not evidence that the file was downloaded or opened successfully.

## Threats and controls

### Path traversal and ambiguous paths

Threat: absolute paths, `..`, backslashes, NUL bytes, protocol schemes, empty segments, repeated separators, dot segments, or encoded ambiguity could escape the virtual project namespace or create inconsistent keys.

Controls:

- Parse all paths through one POSIX normalizer.
- Reject absolute and drive-letter paths.
- Reject backslashes rather than silently reinterpreting them.
- Reject `.` and `..` segments, empty segments, NUL bytes, query/fragment ambiguity, and protocol-like inputs.
- Bound total path and segment byte length.
- Store and compare only canonical normalized paths.
- Apply identical validation to UI, WebMCP, restore, persistence load, and export.

### Sensitive and unsupported files

Threat: an agent could write credential files or opaque/binary content that the application cannot inspect safely.

Controls:

- Allowlist text extensions.
- Reject `.env` variants and common key/certificate/keystore filenames.
- Reject unsupported extensionless files except explicitly allowed project metadata.
- Accept text strings only and calculate UTF-8 byte size before staging.
- Never request, display, log, or persist OpenAI keys.

### Partial multi-file writes

Threat: one invalid item in a batch could leave a half-applied project.

Controls:

- Validate every path, collision, content type, size, batch total, file count, and resulting workspace size before commit.
- Stage the complete next state separately from current state.
- Persist the checkpoint, next state, and activity through one coherent application transaction.
- Publish to the UI only after the transaction succeeds.
- Test a batch containing both valid and invalid members for zero state change.

### Lost updates

Threat: Codex could overwrite a newer human edit based on stale context.

Controls:

- Maintain a monotonic workspace revision.
- Accept optional `expectedRevision` on mutations.
- Reject stale mutations with `REVISION_CONFLICT`, current revision, and a re-read suggestion.
- Increment revision exactly once per committed content mutation.

### Destructive operations

Threat: accidental delete, move, reset, or restore could lose work.

Controls:

- Operate on one explicit file for move and delete.
- Do not support globs or implicit recursive folder deletion.
- Create an automatic checkpoint before content mutation.
- Create a restore-safety checkpoint before restoring when possible.
- Require a lightweight user confirmation for manual delete.
- Keep Reset demo scoped to the active starter and deterministic.

### Resource exhaustion

Threat: large files, large batches, numerous checkpoints, or oversized reads could freeze the page or exhaust browser storage.

Controls:

- Bound files, path bytes, file bytes, batch count, batch bytes, workspace bytes, read count, and read result bytes.
- Retain bounded activity and checkpoint histories.
- Return structured limit errors before allocating export or preview payloads.
- Keep starter projects intentionally small.

### Site Tool duplication or spoofing

Threat: Strict Mode, hot reload, or iframe code could register duplicate or misleading tools.

Controls:

- Register once from the top-level document after services are ready.
- Guard registration per document and stable tool name.
- Never register from Sandpack.
- Use fixed tool definitions from host source, not workspace content.
- Test registration count and hot-reload behavior with the injected adapter.

### Prompt injection through project content

Threat: a starter or edited file could contain text instructing the agent to disclose unrelated data or invoke a dangerous action.

Controls:

- Tool descriptions constrain operations to the Patchwork workspace.
- Read results return only explicitly requested files.
- No tool accesses cookies, browser credentials, unrelated local files, network accounts, or external connectors.
- Mutation authorization remains bounded to explicit validated paths.
- Activity and errors never echo full content.
- The user and agent must treat page and workspace content as untrusted data.

### Host code injection

Threat: project source could escape the preview and execute in the host application's origin or DOM.

Controls:

- Do not use `eval`, `new Function`, or host-side dynamic script injection for workspace content.
- Render file content only in a text editor with framework escaping.
- Execute preview code only through Sandpack's isolated preview environment.
- Do not insert workspace HTML with `dangerouslySetInnerHTML`.
- Load host scripts from the bundled application, not workspace-selected remote URLs.

### Data leakage

Threat: workspace content could be sent to analytics, logs, or a backend without the user's knowledge.

Controls:

- No application backend or workspace sync in the MVP.
- No project-content analytics.
- IndexedDB persistence remains origin-local.
- Activity records paths and summaries, not contents.
- Export is a local, explicit download.
- Dependency and browser requests must be inspected before release; any unavoidable Sandpack runtime fetches must be documented accurately.

## Security limits

- Patchwork is a small-project demonstrator, not a hardened multi-tenant IDE.
- Anyone with access to the same browser profile and origin may be able to inspect IndexedDB.
- Browser extensions, a compromised device, or a compromised hosting origin are outside the application trust model.
- Previewed user code is untrusted. Sandpack isolation reduces risk but does not replace browser sandboxing and dependency hygiene.
- IndexedDB is not encrypted by Patchwork.
- Checkpoints are recovery snapshots, not tamper-proof backups.
- The diagnostics bridge can only report signals exposed by the preview integration.
- WebMCP availability and browser safety review depend on the current ChatGPT/Chrome implementation.

## Dependency and supply-chain policy

- Commit the lockfile.
- Use a small, reviewed dependency set.
- Run a high-severity dependency audit before release and record the exact result.
- Scan the tracked tree and production bundle for likely secrets before each push.
- Do not claim “zero vulnerabilities” when the audit reports unresolved advisories or unexamined transitive behavior.
- Do not add remote scripts to the host page for convenience.

## Release security checklist

- [x] Path-validity matrix passes.
- [x] Unsupported and sensitive filenames are rejected.
- [x] Batch atomicity and zero-partial-write tests pass.
- [x] Revision-conflict test passes, including edits made during an in-flight save.
- [x] Automatic checkpoint and deterministic same-starter restore tests pass.
- [x] Read-only tools show zero state mutation.
- [x] Site Tools register once at top level and never inside the iframe.
- [x] No `eval`, `new Function`, or workspace-driven host script injection.
- [x] Sandpack preview uses the exact `allow-scripts allow-same-origin` sandbox and no capability-policy allowlist.
- [x] Persisted workspace/checkpoint records are runtime-validated before use.
- [x] Secret scan result recorded: 75 files passed on 2026-08-30.
- [x] Dependency audit result recorded and reviewed: 0 npm vulnerabilities on 2026-08-30.
- [x] Production bundle inspected for credentials and unintended endpoints.
- [ ] Public repository and deployed artifact contain no secrets.

## Reporting a vulnerability

Until a public repository exists, report privately to the repository owner. After publication, use the repository's security contact or private vulnerability-reporting feature if enabled. Do not open a public issue containing a working exploit, secret, or private user data.
