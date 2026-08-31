# Patchwork demo video script

## Recording status

- Produced walkthrough duration: **1:50.160**.
- Hard stop: **1:58**. The official limit remains strictly under 3:00.
- Public YouTube URL: `[VIDEO_URL — not uploaded]`
- Live app: `https://patchwork-webmcp.vercel.app/`
- Source: `https://github.com/Damso74/patchwork-webmcp`
- Local final video: `artifacts/video/patchwork-demo-under-2min.mp4` (intentionally gitignored).
- Narration: `docs/assets/video/patchwork-narration-elevenlabs.mp3`, generated with the account-owned **Damien Voice** in ElevenLabs Multilingual v2.
- Thumbnail: `docs/assets/video/patchwork-video-thumbnail.png`.

The produced walkthrough is explicitly labeled **Automated WebMCP walkthrough — same registered handlers**. It injects the documented Playwright adapter before page load and invokes the exact handlers registered by the production page. It is not presented as a ChatGPT conversation. If a native ChatGPT Site Tools take is recorded later, never substitute adapter footage without retaining this distinction.

## Title

**Patchwork — Build with Codex, directly inside the page | WebMCP Challenge**

## 1:50 shot plan and word-for-word narration

### 0:00–0:21 — The reversal

**Picture:** Patchwork open on the clean Relay starter. Files, editor, and preview are visible immediately.

**On-screen text:** `No chatbot · No API key · No separate MCP server`

**Narration:**

> Most AI coding tools pull the project into the agent. Patchwork flips that model: it lets the Codex session you already have work directly inside the web application, with no embedded chatbot, API key, extension, or separate MCP server.

### 0:21–0:38 — One shared workspace

**Picture:** Brief pan across Files, Code, Preview, Diagnostics, and Activity. Do not click Reset during the take.

**On-screen text:** `Local-first · React + TypeScript · IndexedDB`

**Narration:**

> The human keeps a real local-first workspace: virtual files, a text editor, live preview, checkpoints, and ZIP export. Everything persists in this browser, and the interface still works when Site Tools are unavailable.

### 0:38–0:55 — Site Tools contract

**Picture:** Show the ten registered tools, then the canonical prompt. In the automated take, the overlay names the adapter explicitly.

**On-screen text:** `10 top-level WebMCP tools`

**Prompt shown exactly:**

> Inspect the current project and turn it into a premium landing page for an AI travel assistant called Roamly. Keep it responsive, use a warm Indonesian travel aesthetic, add a clear hero, three feature cards and a strong call to action. Create a checkpoint before editing, inspect the preview afterward, fix any errors you find, then summarize the files you changed.

**Narration:**

> When opened in ChatGPT's built-in browser, Patchwork registers ten WebMCP tools from the top-level document. This labeled walkthrough invokes those same registered handlers to read only the explicit files needed. Reads do not change the revision.

### 0:55–1:22 — Atomic Roamly transformation

**Picture:** Let the real tool calls run. Hold on the checkpoint, activity row, revision change, editor update, and finished Roamly preview.

**On-screen text:** `Validate all → checkpoint → one revision → persist`

**Narration:**

> For the transformation, one bounded multi-file write includes the observed revision. Patchwork validates every path and size before changing anything, creates a pre-edit checkpoint, commits the batch atomically, and increments the revision once. The editor and preview update from that same authoritative workspace. If any item were invalid, the entire batch would be rejected without a partial write.

### 1:22–1:36 — Honest diagnostics and recovery

**Picture:** Show `Preview ready`, `No issues`, and the checkpoint popover. Do not inject a fake error.

**On-screen text:** `Compiler/runtime signals · Explicit recovery`

**Narration:**

> The walkthrough then inspects the compiler and runtime signals available from the preview. This run reports no blocking error, so Patchwork makes no invented visual claim. Every mutation remains recoverable through an explicit checkpoint, and project data never goes to a Patchwork backend.

### 1:36–1:50 — Close

**Picture:** Finished Roamly preview beside the changed files, then a clean end card.

**On-screen text:**

```text
Patchwork
patchwork-webmcp.vercel.app
github.com/Damso74/patchwork-webmcp
Independent project — not affiliated with or endorsed by OpenAI
```

**Narration:**

> Patchwork makes WebMCP the structured collaboration layer between a real product interface and the agent the user already has. Try the live demo and inspect the complete open-source implementation.

## Exact click order

1. Start recording on the clean Relay workspace at revision 0, with the adapter label visible for an automated take.
2. Hold the complete workspace for two seconds.
3. Open Site Tools and show the tool names briefly.
4. Paste the canonical prompt without editing it.
5. Let the real read, checkpoint, and write calls complete.
6. Hold on revision 1, the activity row, and the Roamly preview.
7. Show `Preview ready`, `No issues`, and the checkpoint list.
8. End on the finished preview and URL card.

Do not demonstrate restore or ZIP download in the main take; mention recovery in narration and keep those features in README/Devpost. This saves roughly 35 seconds without weakening the WebMCP proof.

## Expected factual result

- Initial state: Relay, revision 0, activity 0.
- Manual checkpoint created before editing.
- Atomic write changes `src/App.tsx`, `src/content.ts`, and `src/styles.css`.
- Final state: Roamly, revision 1.
- Preview status: `ready`, rendered revision 1, no reported diagnostics.
- Revision remains stable after the write.

If the real run differs, narrate only what actually happened.

## Fast failure plan

- Tool call fails before mutation: stop and begin a new take from the clean checkpoint.
- Repairable compilation error: keep it only if the repair still finishes before 1:50; otherwise restart.
- Site Tools unavailable: stop. Do not imitate a native session with the adapter.
- No diagnostic error: use the honest “no blocking error” narration above.

## Pre-recording checklist

- [ ] Relay is visible at revision 0 with activity 0.
- [ ] Preview is ready before recording starts.
- [ ] Ten Site Tools are visible.
- [ ] Notifications and unrelated tabs are hidden.
- [ ] Prompt is already in the clipboard.
- [ ] Canvas is 1080p minimum and editor text is legible.
- [ ] Microphone audio is clear; no copyrighted music.
- [x] Final runtime is between 1:40 and 1:58: **1:50.160 measured with ffprobe**.
- [ ] Captions match the actual take.
- [ ] YouTube visibility is Public.
- [ ] Public video link works signed out.

## Thumbnail

The final thumbnail is a bright split view: Patchwork code on the left, a warm Indonesian preview on the right, and the exact label **“THE PAGE BECOMES THE TOOL.”** It uses only Patchwork's own visual identity and contains no OpenAI mark.

## YouTube description

```text
Patchwork is a local-first browser workspace where a person and their existing Codex session work on the same small web project through WebMCP Site Tools.

No embedded chatbot. No OpenAI API key. No extension. No separate MCP server.

Live demo: https://patchwork-webmcp.vercel.app/?demo=landing
Source: https://github.com/Damso74/patchwork-webmcp

Built for the OpenAI WebMCP Challenge. Patchwork is an independent project and is not affiliated with or endorsed by OpenAI.
```

## Subtitle text

Use `docs/assets/video/patchwork-demo.en.srt`. Its cue boundaries follow the measured ElevenLabs audio and detected pauses; verify once more against the uploaded encode.
