# Patchwork demo video script

## Recording status

- Final local encode: **1:30.000**, strictly below the official three-minute limit.
- File: `artifacts/video/patchwork-demo-under-2min.mp4` (gitignored).
- Format: 1920×1080 H.264, AAC mono, approximately -16 LUFS.
- Captions: English captions are burned into the image; the matching source is `docs/assets/video/patchwork-demo.en.srt`.
- Narration: ElevenLabs **Eric — Smooth, Trustworthy**, English-language, Multilingual v2, speed `0.96`.
- SHA-256: `1AE559538600C5C511141A26D91C3F1489309AD17C4112F7978C522F9BB5EC1E`.
- YouTube: [https://youtu.be/Xxd2tr92WjM](https://youtu.be/Xxd2tr92WjM), Public and reachable through YouTube's unauthenticated oEmbed endpoint.

The take is persistently labeled **Automated adapter walkthrough — not ChatGPT footage**. It injects the documented Playwright adapter before page load and invokes the exact handlers the page registers in production. It is evidence of the handler contract, not footage of a ChatGPT conversation. The narration phrase “Inside ChatGPT” describes the native product capability; the persistent label makes clear that the pictured walkthrough is the adapter run.

## Title

**Patchwork — Build with Codex, directly inside the page | WebMCP Challenge**

## 1:30 shot plan and word-for-word narration

### 0:00–0:13 — Reverse the usual model

**Picture:** Clean Relay starter with files, editor, live preview, the ten-tool status, and the automated-walkthrough label visible.

**On-screen text:** `No chatbot · No API key · No extension · No separate MCP server`

**Narration:**

> Most AI coding tools pull projects into the agent. Patchwork reverses that. It is a browser canvas with no embedded chatbot, API key, extension, or separate MCP server.

### 0:13–0:24 — One local-first workspace

**Picture:** Move through `content.ts`, `styles.css`, and `App.tsx` while the preview remains visible.

**On-screen text:** `Files · Preview · Checkpoints · ZIP export`

**Narration:**

> Everything stays local-first. Files and checkpoints live in this browser. A human edits code, watches the preview, resets, and exports a ZIP.

### 0:24–0:40 — Structured site tools

**Picture:** Show the ten tool names, run context/list/read, then show the canonical mission card. Keep the persistent `Automated adapter walkthrough — not ChatGPT footage` label visible.

**On-screen text:** `10 top-level WebMCP tools · Explicit reads · Observed revision`

**Narration:**

> Inside ChatGPT, Codex discovers ten WebMCP tools registered by the top-level page. It requests context, then reads only the files it needs. The page returns paths, content, sizes, and the observed revision.

**Canonical prompt shown exactly:**

> Inspect the current project and turn it into a premium landing page for an AI travel assistant called Roamly. Keep it responsive, use a warm Indonesian travel aesthetic, add a clear hero, three feature cards and a strong call to action. Create a checkpoint before editing, inspect the preview afterward, fix any errors you find, then summarize the files you changed.

### 0:40–0:52 — One atomic mutation

**Picture:** Create the requested manual checkpoint, then call one three-file `write_files` operation with expected revision 0.

**On-screen text:** `Validate all → checkpoint → one revision → persist`

**Narration:**

> Now Codex updates three files in one atomic write. Patchwork validates the full batch, creates an automatic checkpoint, applies every change together, and increments the revision once.

### 0:52–1:05 — Visible receipt and real preview

**Picture:** Hold the in-page Patchwork receipt, three highlighted files, `Custom landing page`, revision 1, then the real Roamly preview.

**On-screen text:** `WEBMCP · WRITE_FILES · Revision 0 → 1 · Checkpoint saved`

**Narration:**

> The interface responds immediately. A WebMCP receipt names the operation, the changed files are highlighted, and the preview reveals Roamly. Codex then inspects compiler and runtime diagnostics.

### 1:05–1:25 — Recovery, export, and why WebMCP matters

**Picture:** Enter Focus Preview, show Roamly, `Preview ready`, zero errors and warnings, then open the checkpoint list with Restore controls.

**On-screen text:** `Explicit recovery · Export stays human-controlled`

**Narration:**

> A checkpoint can restore the prior state, and export remains under human control. This is why WebMCP matters: instead of guessing at pixels, the agent gets schemas, revisions, diagnostics, and atomic operations. Patchwork is independent and is not affiliated with or endorsed by OpenAI.

### 1:25–1:30 — Close

**Picture:** Warm Patchwork end card.

**On-screen text:**

```text
Patchwork
Build with Codex, directly inside the page.
patchwork-webmcp.vercel.app
github.com/Damso74/patchwork-webmcp
Independent project — not affiliated with or endorsed by OpenAI
```

No narration is added to the five-second reading hold.

## Exact automated take order

1. Load `?demo=landing&fresh=1`; verify Relay, revision 0, 10 registered tools, Preview ready, and the real Relay heading in the iframe.
2. Invoke `get_workspace_context`, `list_files`, and `read_files` for the three explicit files.
3. Show the canonical prompt.
4. Invoke `create_checkpoint` with `Before Roamly demo`.
5. Invoke one `write_files` call for `src/App.tsx`, `src/content.ts`, and `src/styles.css` with expected revision 0.
6. Require the visible WebMCP receipt, revision 1, three highlighted files, and the real `Go farther. Feel closer.` heading inside the iframe.
7. Enter Focus Preview, invoke `inspect_preview`, and show its honest compiler/runtime result.
8. Open the checkpoint list, close it, exit focus, and finish on the end card.

## Expected factual result

- Initial state: Relay, revision 0, no checkpoint.
- Reads do not change the revision.
- Manual checkpoint: `Before Roamly demo`, source revision 0.
- Atomic write: exactly three files, one automatic checkpoint, final revision 1.
- UI receipt: `WEBMCP · WRITE_FILES`, three files, revision 0 → 1, checkpoint saved.
- Preview: real Roamly heading visible in the Sandpack iframe.
- Diagnostics: `ready`, rendered revision 1, zero errors and warnings in this take.
- Console: zero application errors. The recording locally suppresses only CodeSandbox's telemetry endpoint and records each suppressed request in the proof JSON.

If the actual run differs, stop and record again. Never narrate a result that is not visible or present in the proof receipt.

## Failure plan

- Tool registration, read, or write fails: stop; reload the isolated `fresh=1` state and restart.
- Revision is not 0 before mutation: stop; the deterministic state is invalid.
- Editor changes but the iframe does not show Roamly: stop; never accept state-only evidence.
- Preview reports a repairable error: repair only if the honest take still stays below the limit; otherwise restart.
- Any console error other than the explicitly suppressed CodeSandbox telemetry request: fail the take.
- Native Site Tools unavailable: do not imitate a native ChatGPT session with adapter footage.

## Pre-upload checklist

- [x] 1920×1080 H.264/AAC master produced.
- [x] Final runtime measured at 90.000 seconds.
- [x] English captions burned into the video and visually sampled.
- [x] Roamly visibly rendered after the atomic write.
- [x] Checkpoint list, diagnostics, revision, and end card visibly sampled.
- [x] Audio normalized to approximately -16 LUFS with no decode error.
- [ ] Human watches the complete master with sound at 1× speed.
- [x] The persistent `Automated adapter walkthrough — not ChatGPT footage` label remains visible in the reviewed contact sheet and is accurately described; no ChatGPT conversation is claimed.
- [x] YouTube visibility is Public and the link works without authentication.

## Thumbnail

Use the bright Patchwork split view in `docs/assets/video/patchwork-video-thumbnail.png` with the exact label **THE PAGE BECOMES THE TOOL**. It contains no OpenAI mark.

## YouTube description

```text
Patchwork is a local-first browser workspace where a person and their existing Codex session work on the same small web project through WebMCP Site Tools.

No embedded chatbot. No OpenAI API key. No extension. No separate MCP server.

This video contains a clearly labeled automated walkthrough that invokes the same WebMCP handlers registered by the production page.

Live demo: https://patchwork-webmcp.vercel.app/?demo=landing
Source: https://github.com/Damso74/patchwork-webmcp

Built for the OpenAI WebMCP Challenge. Patchwork is an independent project and is not affiliated with or endorsed by OpenAI.
```

## Caption source

`docs/assets/video/patchwork-demo.en.srt` matches the measured ElevenLabs pauses. Captions are burned into the local MP4 and the same SRT was published in YouTube Studio as an English (United States) track. The public watch response exposes `en` and `en-US` caption tracks.
