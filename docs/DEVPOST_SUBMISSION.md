# Devpost submission copy

> This copy matches public release `v1.0.3-webmcp-challenge`. The public video and the complete 4/5 Devpost draft are verified; the entrant must personally accept the Official Rules before submitting.

## Project name

Patchwork

## Tagline

Build with Codex, directly inside the page.

## Short description

Patchwork lets a person and Codex edit the same local-first web project through structured WebMCP Site Tools—without a chatbot, API key, extension, backend, or separate MCP server.

## Inspiration

Most AI coding tools bring the project into the agent's interface. We wanted to explore the inverse: what if the application itself could offer a precise, safe collaboration surface to the agent the user already has?

Web development is a strong test case because the human needs visual context while the agent needs structured access to files, diagnostics, and mutations. Clicking through a file tree is possible, but it is slow and ambiguous. Patchwork keeps the project, preview, and recovery controls visible while WebMCP gives Codex operations with explicit schemas and outcomes.

## What it does

Patchwork provides a browser-based workspace for small React projects. A user can load one of three deterministic starters, select and edit text files, inspect a live preview and available diagnostics, create or restore checkpoints, reset the current demo, and export the project as a ZIP.

When the page is opened in a compatible ChatGPT browser, Codex can discover Patchwork's Site Tools. It can read workspace context and explicit files, apply a validated multi-file change, move or delete one explicit file, inspect preview diagnostics, manage checkpoints, and prepare an export. UI actions and agent tools call the same workspace services, so both participants see the same revision and result.

Patchwork remains usable as a human-only application when WebMCP is unavailable.

## How we built it

The host application uses React, strict TypeScript, and Vite. Sandpack provides the editor/preview runtime, IndexedDB stores local workspace state, and JSZip prepares local exports.

The workspace domain normalizes relative POSIX paths, allowlists text formats, enforces per-file, per-batch, and total-workspace limits, and stages complete mutations before commit. An optional expected revision prevents silent stale overwrites. Every committed content mutation creates a checkpoint first and increments the workspace revision once.

WebMCP is registered imperatively with `document.modelContext.registerTool()` in the top-level host document after workspace services are ready. The Sandpack iframe does not register tools. An injected Playwright adapter captures those production registrations and invokes the real handlers for deterministic tests; it is not a second tool implementation.

## How WebMCP is used

Patchwork exposes these stable tools:

- `get_workspace_context`
- `list_files`
- `read_files`
- `write_files`
- `move_file`
- `delete_file`
- `inspect_preview`
- `create_checkpoint`
- `restore_checkpoint`
- `prepare_project_export`

Read tools return bounded, structured state without changing files, checkpoints, activity, persistence, or revision. Mutations validate the entire request before committing, create recovery checkpoints, and return stable receipts with revision and changed paths. Errors are structured and repairable, including stale revision, invalid path, collision, unsupported extension, and size-limit cases.

## Why WebMCP is load-bearing

Without WebMCP, the agent would need to guess the application's state and manipulate files through pixels, focus, and keystrokes. That makes multi-file changes, concurrency, recovery, and verification fragile.

With WebMCP, the page provides explicit schemas for reading selected files, applying one atomic batch, checking the observed revision, inspecting available diagnostics, and restoring a known snapshot. This is not a shortcut around the product UI: it is the collaboration layer that lets the person and agent operate the same live application with shared state and clear effects.

## Challenges

The hardest design problem was making Site Tools useful without turning Patchwork into a remote shell. We constrained the workspace to small text projects, made paths and payloads narrowly valid, and separated export preparation from the user-triggered download.

Another challenge was integrating an iframe-based preview while respecting current ChatGPT Site Tools limitations. Registration belongs to the top-level document, so the host owns the WebMCP boundary and receives only supported preview status and diagnostics from Sandpack. Patchwork does not claim visual understanding when it only has compiler or runtime signals.

Finally, UI actions and agent calls had to stay consistent. We avoided parallel implementations by routing both through the same domain and persistence services.

## Accomplishments

- A browser-native collaboration model with no embedded chatbot or API key.
- A shared service layer for human and WebMCP operations.
- Atomic, revision-aware multi-file mutations with automatic recovery snapshots.
- Deterministic demo starters and reset behavior.
- Graceful human operation when Site Tools are unavailable.
- A production-handler test adapter that does not duplicate business logic.

## What we learned

WebMCP is most valuable when a web product already has clear domain operations. The best tools are not generic clicks; they expose meaningful application actions with narrow inputs, honest side effects, and enough result data to verify the outcome.

We also learned that local-first architecture is a useful fit for agent collaboration. It reduces setup and data movement, but it still needs explicit limits, persistence validation, concurrency control, and recovery. Finally, preview diagnostics and visual review are different evidence and should never be conflated.

## What's next

After the challenge build is frozen, potential follow-ups include a small public-GitHub import with strict limits, a human-readable diff view, and a read-only share format. These are not part of the submitted MVP unless independently implemented and verified before the deadline.

## Built with

React 19, TypeScript, Vite, CodeSandbox Sandpack, IndexedDB, idb, JSZip, Vitest, Testing Library, Playwright, Oxlint, Prettier, and WebMCP Site Tools. ElevenLabs was used only for the English demo narration.

## Links

- Live demo: `https://patchwork-webmcp.vercel.app/?demo=landing`
- Public repository: `https://github.com/Damso74/patchwork-webmcp`
- Video: `https://youtu.be/Xxd2tr92WjM`
- Public release: `https://github.com/Damso74/patchwork-webmcp/releases/tag/v1.0.3-webmcp-challenge`

## Repository

`https://github.com/Damso74/patchwork-webmcp`

Verified public without authentication; GitHub detects the MIT license.

## Live demo

`https://patchwork-webmcp.vercel.app/?demo=landing`

Other deterministic routes: `?demo=dashboard` and `?demo=travel`.

## Video

[https://youtu.be/Xxd2tr92WjM](https://youtu.be/Xxd2tr92WjM)

The public encode is 1:30.000 at 1920×1080 with English-language ElevenLabs narration, burned English captions, no music, and a persistent **Automated adapter walkthrough — not ChatGPT footage** label. It uses the same production-registered handlers and is not presented as a ChatGPT conversation. YouTube reports Public visibility, no copyright issue, English (United States) language, and a published English caption track. Unauthenticated oEmbed and watch-page checks succeeded on 2026-09-01.

## Devpost additional information field map

- **Submitter Type:** Individual
- **Country:** France
- **App Status:** New
- **Learning or skill development:** Significant
- **Career AI value:** Yes
- **Clients used to test WebMCP:** Codex in-app browser with native Site Tools (ten production-registered tools), plus Chromium through Playwright with an injected WebMCP registration adapter that invokes the same production handlers for deterministic end-to-end tests.
- **AI tools used:** Codex for product design, implementation, testing, documentation, and release verification; ElevenLabs for the English demo narration. Patchwork itself makes no direct OpenAI API call and requires no API key.
- **Team state:** Verified individual entry with Damien CREDOZ as the sole entrant.
- **Media state:** Verified after reload: project thumbnail, two gallery images and captions, public video, live URL, and repository URL are present.

## Testing instructions

1. Open `https://patchwork-webmcp.vercel.app/?demo=landing` in the latest ChatGPT desktop app's built-in browser. Use GPT-5.6 Sol or Terra and a workspace where Site Tools are available.
2. Select **Reset demo** to load the deterministic landing baseline.
3. Open Site Tools from the browser address bar and inspect the registered Patchwork tools.
4. Paste this prompt:

   > Inspect the current project and turn it into a premium landing page for an AI travel assistant called Roamly. Keep it responsive, use a warm Indonesian travel aesthetic, add a clear hero, three feature cards and a strong call to action. Create a checkpoint before editing, inspect the preview afterward, fix any errors you find, then summarize the files you changed.

5. Observe file reads, the checkpoint, the revision change, activity, editor update, preview, and diagnostic inspection.
6. Use Checkpoints to restore an explicit snapshot, or select Export to download the local ZIP.
7. Human-only fallback: open the same URL in a browser without WebMCP and edit a file manually; the core workspace remains available.

Alternative Chrome test: use Chrome 149+ with `chrome://flags/#enable-webmcp-testing`, restart, and open the same URL.

## Privacy and data handling

Patchwork's MVP has no project backend, user account, direct OpenAI API call, or requested API key. Workspace state and checkpoints are stored in the browser's IndexedDB for the current origin. Activity records operation metadata, not file contents. The source needed for preview compilation is processed by the third-party CodeSandbox Sandpack runtime; users should not place secrets or sensitive production code in this demo. ZIP export stays local to the browser.

## Open-source license

MIT License, detected on the public GitHub repository.

## Disclaimer

Patchwork is an independent project and is not affiliated with or endorsed by OpenAI. OpenAI, ChatGPT, and Codex are referenced only to describe compatibility and the challenge context.

## Final factual checklist

- [x] Every described feature exists in the deployed v1.0.3 build.
- [x] All validation results are recorded with exact pass/fail/not-run status.
- [x] Native Codex, adapter, and manual ChatGPT evidence are described as separate states.
- [x] Live URL works in a clean, signed-out context.
- [x] Public repository exposes source, instructions, and detectable MIT license.
- [x] Video runtime is strictly below three minutes: 1:30.000 measured.
- [x] Video URL is public and verified without authentication.
- [x] Bracketed placeholders are removed.
- [ ] Submitted artifacts are frozen after the deadline.
