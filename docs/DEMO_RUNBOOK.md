# Patchwork demo runbook

## Truth gate

Run this demo only against a verified build. Do not substitute the Playwright adapter for a native Site Tools session without labeling it clearly.

- Live URL: `https://patchwork-webmcp.vercel.app/`
- Repository: `https://github.com/Damso74/patchwork-webmcp`
- Public release: `v1.0.3-webmcp-challenge`, commit `6090a4a2a97a889f51dfa61c99faaf374313e098`
- Native Codex in-app-browser proof: `PASS — 10 top-level tools, revision 0 → 1 write → 2 restore, preview ready, and zero console errors on 2026-08-31`

## Canonical entry points

- Landing transformation: `https://patchwork-webmcp.vercel.app/?demo=landing`
- Dashboard: `https://patchwork-webmcp.vercel.app/?demo=dashboard`
- Travel planner: `https://patchwork-webmcp.vercel.app/?demo=travel`

Use a clean browser context for judging checks. Confirm that each URL loads the requested starter directly and that Reset demo reproduces the same files and content.

## Pre-demo checklist

- [ ] Production URL returns the current submitted revision.
- [ ] Landing, dashboard, and travel URLs load without authentication or unexpected redirects.
- [ ] Browser console has no blocking host error.
- [ ] Landing preview reaches ready state before the demo.
- [ ] Reset demo restores the bundled landing snapshot exactly.
- [ ] Checkpoint list is understandable and contains no stale rehearsal data.
- [ ] Export creates a readable ZIP in a manual browser test.
- [ ] Site Tools are enabled in the latest ChatGPT desktop app.
- [ ] Use GPT-5.6 Sol or Terra; Luna currently has Site Tools disabled.
- [ ] The workspace is not Enterprise or Edu, where Site Tools are currently unavailable.
- [ ] Screen recording captures system audio or microphone narration clearly.
- [ ] Notifications and unrelated tabs are hidden.

## Main real-ChatGPT walkthrough

### 1. Open and reset

1. Open `https://patchwork-webmcp.vercel.app/?demo=landing` in ChatGPT's built-in browser.
2. Wait for local restoration and preview readiness.
3. Select **Reset demo** and confirm the deterministic landing baseline.
4. Point out Files, Code, Preview, Diagnostics, and Activity.
5. Open the address-bar Site Tools control and confirm the expected Patchwork tools are visible.

Expected: the landing starter is active, the preview is ready, and Site Tools are registered from the page.

### 2. Send the canonical prompt

Paste exactly:

> Inspect the current project and turn it into a premium landing page for an AI travel assistant called Roamly. Keep it responsive, use a warm Indonesian travel aesthetic, add a clear hero, three feature cards and a strong call to action. Create a checkpoint before editing, inspect the preview afterward, fix any errors you find, then summarize the files you changed.

Do not edit the prompt during the recorded run.

### 3. Observe reads

Expected agent sequence may include:

1. `get_workspace_context`
2. `list_files`
3. `read_files`
4. `create_checkpoint`

Show that read calls do not increment the workspace revision. If the agent chooses a different valid read order, do not force a scripted sequence; explain only what actually happened.

### 4. Observe the atomic change

Expected mutation:

- `write_files` changes a small explicit set of project files.
- One new workspace revision appears.
- An automatic pre-mutation checkpoint appears.
- Activity lists changed paths without file contents.
- Editor and preview update from the same workspace state.

If the agent attempts an unsupported path, oversized batch, or stale revision, keep the structured error visible and allow it to repair the request. Do not conceal a failed call in editing.

### 5. Inspect and repair

Expected:

1. The agent invokes `inspect_preview`.
2. If diagnostics exist, it reads the affected file and submits a bounded correction.
3. It invokes `inspect_preview` again.
4. It summarizes the changed files and current diagnostic state.

Never narrate “visual verification” unless the real session used a reliable visual/browser capability. `inspect_preview` alone proves only the reported compilation/runtime signals.

### 6. Recovery and export

1. Open the checkpoint list and identify the pre-edit state.
2. If demonstrating recovery, restore it and show the exact landing baseline.
3. Otherwise, create a named final checkpoint.
4. Select Export and download the ZIP.
5. If time permits, show the manifest or downloaded filename, not private filesystem paths.

## Deterministic manual checks

### Starter routing

For each `landing`, `dashboard`, and `travel`:

1. Open a clean context with the corresponding query parameter.
2. Record starter ID, active path, sorted file paths, and preview state.
3. Mutate one file manually.
4. Reset.
5. Confirm starter ID, active path, file paths, and file contents match the original observation.

### Persistence

1. Modify a harmless visible string.
2. Wait for saved status.
3. Reload the same demo URL.
4. Confirm the string, active file, revision, checkpoints, and activity restore as designed.
5. Reset before the recorded demo.

### Human fallback

1. Open the production build in a browser without `document.modelContext`.
2. Confirm the Site Tools unavailable message is discreet and accurate.
3. Edit a file manually, inspect preview, create/restore a checkpoint, reset, and export.

## Adapter walkthrough

The Playwright adapter is appropriate for repeatable automated evidence. Label any screen or artifact **“Automated WebMCP adapter test — not a ChatGPT Site Tools session.”**

Recommended adapter scenario:

1. Inject the adapter before page load.
2. Assert the expected tool names and single registration count.
3. Invoke context, list, and read tools; snapshot state before and after.
4. Invoke a multi-file write at the observed revision.
5. Confirm one checkpoint, one revision, UI update, and preview update.
6. Introduce a deliberate compile error through `write_files`.
7. Confirm `inspect_preview` exposes the diagnostic.
8. Repair it through the same handler and re-inspect.
9. Restore a checkpoint and prepare export.

## Failure plan

### Site Tools do not appear

- Confirm the latest ChatGPT desktop app, supported model, supported workspace type, and Site Tools permission.
- Reload the top-level Patchwork page once.
- Confirm the production console has no registration error.
- If still unavailable, stop the real-session claim. Record the adapter demonstration separately and list real ChatGPT validation as not run or failed.

### Preview remains compiling

- Wait briefly for Sandpack initialization.
- Open diagnostics and capture the actual message.
- Reset the demo.
- If the baseline remains broken, do not record; fix and redeploy before continuing.

### Agent writes an invalid batch

- Show the structured error briefly.
- Ask the agent to re-read workspace context and retry with a smaller valid batch.
- Preserve the incident in notes; it can demonstrate repairability if the final result succeeds.

### Network or model call fails

- Do not fabricate continuation.
- Restart from the deterministic reset and record a new honest take.
- Keep a local adapter walkthrough available as explicitly labeled backup footage, not as fake ChatGPT footage.

## Evidence log template

```text
Date/time:
App and version:
Workspace type:
Model:
Live URL:
Submitted revision:
Starter:
Prompt:
Tools discovered:
Tool calls observed:
Initial revision:
Final revision:
Checkpoint IDs/kinds:
Preview status:
Files changed:
Export filename:
Result: PASS / FAIL / NOT RUN
Notes:
```
