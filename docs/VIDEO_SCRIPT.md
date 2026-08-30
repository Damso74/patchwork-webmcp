# Patchwork demo video script

## Recording status

- Target duration: **2:40**; the official limit is strictly under 3:00.
- Public YouTube URL: `[VIDEO_URL — not uploaded]`
- Live app URL: `[LIVE_URL — not confirmed]`
- Repository URL: `[REPOSITORY_URL — not confirmed]`

Record only after the features named below pass the release checklist. Remove or rewrite any line that is not true of the submitted build. Adapter footage must be labeled as adapter footage and must not imitate a real ChatGPT session.

## Title

**Patchwork — Build with Codex, directly inside the page | WebMCP Challenge**

## Shot plan and word-for-word narration

### 0:00–0:15 — The problem

**Picture:** Clean title card, then the Patchwork landing starter in the browser. Keep OpenAI marks secondary and unmodified.

**On-screen text:**

```text
Patchwork
Build with Codex, directly inside the page
No embedded chatbot · No API key · No separate MCP server
```

**Narration:**

> Most AI coding tools bring your project into the agent's interface. Patchwork does the opposite: it gives the Codex session you already have a structured way to work inside the web application itself. There is no embedded chatbot, API key, extension, or separate MCP server.

### 0:15–0:35 — Shared workspace

**Picture:** Pan across Files, Code, Preview, Diagnostics, and Activity. Switch once between landing and dashboard, then return to landing and reset.

**On-screen text:** `Local-first browser workspace · React + TypeScript · IndexedDB`

**Clicks:** Landing starter → Reset demo → active CSS or component file.

**Narration:**

> Patchwork is a local-first web workspace. A person can choose a starter, edit its files, watch the live preview, create checkpoints, and export a ZIP. The project is stored in IndexedDB and Reset demo always restores the bundled starter.

### 0:35–1:02 — Site Tools discovery and reads

**Picture:** Open Site Tools in ChatGPT's built-in browser. Show the Patchwork tool list, then paste the canonical prompt.

**On-screen text:** `Top-level document.modelContext.registerTool()`

**Prompt shown exactly:**

> Inspect the current project and turn it into a premium landing page for an AI travel assistant called Roamly. Keep it responsive, use a warm Indonesian travel aesthetic, add a clear hero, three feature cards and a strong call to action. Create a checkpoint before editing, inspect the preview afterward, fix any errors you find, then summarize the files you changed.

**Narration:**

> In ChatGPT's built-in browser, Patchwork registers Site Tools from the top-level document. Codex can discover the workspace context, list files, and read only the explicit text files it needs. These reads do not change the project or its revision.

### 1:02–1:40 — Atomic multi-file mutation

**Picture:** Show tool activity, then the revision and checkpoint change. Let the editor and preview visibly update to Roamly. Avoid cutting across a failed call unless it is explained.

**On-screen text:** `Validated batch → checkpoint → one revision → UI update`

**Narration:**

> For changes, Codex sends a bounded multi-file write with an expected revision. Patchwork validates every path and size before committing anything. A valid batch creates a pre-edit checkpoint, increments the revision once, persists locally, and updates the same interface the person is watching. An invalid batch writes nothing.

### 1:40–2:08 — Diagnostics and repair

**Picture:** Show Diagnostics and the agent's `inspect_preview` result. If a real error occurs, show the bounded repair and second inspection. If no error occurs, do not fabricate one; show the clean diagnostic result.

**On-screen text:** `Compiler/runtime signals — no invented visual claims`

**Narration when a real error is repaired:**

> The agent inspects the preview's available compiler and runtime diagnostics, finds the error, repairs the affected file, and checks again. Patchwork reports only signals it can actually observe; it does not pretend diagnostics are visual understanding.

**Alternate narration when no error occurs:**

> The agent inspects the preview's available compiler and runtime diagnostics and finds no reported blocking error. Patchwork reports only signals it can actually observe; it does not pretend diagnostics are visual understanding.

### 2:08–2:30 — Recovery and export

**Picture:** Open checkpoints, highlight the automatic checkpoint, then show export preparation and the user-triggered ZIP action. Restore only if it fits the take without hiding the finished design.

**On-screen text:** `Automatic recovery · Explicit restore · Local ZIP export`

**Narration:**

> Every content mutation is recoverable. The user can restore an explicit checkpoint, with a safety snapshot of the current state, or export the project as a local ZIP. Workspace contents are not sent to a Patchwork backend.

### 2:30–2:40 — Close

**Picture:** Finished Roamly preview beside the file tree. End card with real URLs inserted before recording.

**On-screen text:**

```text
Patchwork
[LIVE_URL]
[REPOSITORY_URL]
Independent project — not affiliated with or endorsed by OpenAI
```

**Narration:**

> Patchwork makes WebMCP the collaboration layer between a real product interface and the agent the user already has. Try the live demo and inspect the open-source repository.

## Expected click order

1. Open `[LIVE_URL]?demo=landing`.
2. Reset demo.
3. Show the five workspace regions.
4. Open Site Tools and show registered names.
5. Paste the canonical prompt.
6. Allow the real agent to read, checkpoint, and write.
7. Show revision, activity, changed files, and preview.
8. Show the actual diagnostic result and any real repair.
9. Open checkpoints.
10. Prepare and trigger export.
11. Show end card.

## Expected result

The landing starter becomes a responsive Roamly page with a warm Indonesian travel direction, a hero, three feature cards, and a strong call to action. The recorded run should visibly connect tool calls to the revision, checkpoint, editor, preview, and activity. Replace this expectation with factual notes if the real agent produces a different valid result.

## Backup plan

- If a tool call fails repairably, keep the error visible and let the agent re-read context and retry once.
- If Site Tools are unavailable, do not stage a fake session. Record the automated adapter walkthrough as a clearly labeled technical appendix and mark the real test accordingly.
- If the preview baseline breaks, stop, reset, and begin a new take after the issue is fixed.
- If the agent produces a correct page with no diagnostic error, use the alternate honest narration rather than injecting a fake failure.

## Pre-recording checklist

- [ ] Final deployed revision confirmed.
- [ ] Real ChatGPT Site Tools run completed or honestly marked unavailable.
- [ ] All visible features used in narration verified.
- [ ] Final URL and repository placeholders replaced.
- [ ] No secret, notification, personal tab, local username, or private path visible.
- [ ] Video canvas is 1080p or higher and text remains legible.
- [ ] Narration and browser audio are clear.
- [ ] Runtime is below 2:50 before upload.
- [ ] No copyrighted music.
- [ ] Captions checked against the submitted build.
- [ ] YouTube visibility set to Public.
- [ ] Public link tested in a signed-out window.

## Thumbnail suggestion

A bright split view: Patchwork's file tree and code on the left, the finished warm Roamly preview on the right, with a small centered label: **“The page becomes the tool.”** Use Patchwork's own palette and mark; do not use or imitate an OpenAI logo.

## YouTube description

```text
Patchwork is a local-first browser workspace where a person and their existing Codex session can work on the same small web project through WebMCP Site Tools.

No embedded chatbot. No OpenAI API key. No extension. No separate MCP server.

Live demo: [LIVE_URL]
Source: [REPOSITORY_URL]

Built for the OpenAI WebMCP Challenge. Patchwork is an independent project and is not affiliated with or endorsed by OpenAI.
```

## Subtitle file text

Use the narration paragraphs above verbatim. After the final take, generate timestamps from the actual audio rather than claiming that planned timecodes exactly match the recording. Verify product names, URLs, and the alternative diagnostics paragraph before upload.
