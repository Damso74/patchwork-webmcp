# Patchwork product specification

> Product contract for the challenge build. Confirm implementation and validation status in `docs/VERIFICATION.md` before reusing any statement as a release claim.

## One-line promise

Patchwork is a local-first browser workspace where a person and their existing Codex session can inspect, edit, verify, checkpoint, and export the same small web project through structured WebMCP site tools.

**Tagline:** Build with Codex, directly inside the page.

Patchwork is an independent project and is not affiliated with or endorsed by OpenAI.

## Problem

Most AI coding products move the project into an agent-specific interface or require an extension, another account, an API key, or a separate MCP server. That creates setup work and separates the agent's actions from the live application the user is reviewing.

Patchwork reverses that relationship. The project remains in a visual browser workspace. The page exposes a small, explicit set of operations through WebMCP, so the agent can work with the same files, preview, diagnostics, revisions, and checkpoints that the person sees.

## Audience

- Product designers and frontend developers exploring an idea on a laptop or tablet.
- Non-specialists who want a controlled, inspectable web-development canvas without installing a toolchain.
- Agent-tool builders evaluating browser-native collaboration patterns.
- Hackathon judges who need a short, deterministic demonstration of non-trivial WebMCP use.

## Core jobs

1. Start from a small project that renders immediately.
2. Read and edit its text files without leaving the page.
3. Ask Codex to inspect and change multiple files through structured operations.
4. See the editor, preview, diagnostics, revision, and activity update from the same mutation.
5. Recover safely by restoring a checkpoint or resetting the selected demo.
6. Export the current project without sending its contents to a backend.

## Golden path

1. Open Patchwork in ChatGPT's built-in browser.
2. Load the deterministic landing-page demo.
3. Inspect the file tree, active file, and live preview.
4. Ask Codex to use the page's site tools and paste the canonical Roamly prompt.
5. Codex reads workspace context and the relevant files.
6. Codex creates a checkpoint, writes a validated multi-file batch, and inspects diagnostics.
7. The UI reflects the new revision and changed files immediately.
8. If needed, Codex repairs an error and re-inspects the preview.
9. The user reviews activity, restores a checkpoint, or exports a ZIP.

## Canonical demonstration prompt

> Inspect the current project and turn it into a premium landing page for an AI travel assistant called Roamly. Keep it responsive, use a warm Indonesian travel aesthetic, add a clear hero, three feature cards and a strong call to action. Create a checkpoint before editing, inspect the preview afterward, fix any errors you find, then summarize the files you changed.

## MVP product contract

The submission build must provide:

- A strict React and TypeScript host application.
- A virtual text-file workspace with safe create, select, rename, move, and delete operations.
- An approachable text editor and a live Sandpack preview.
- Visible compilation or runtime diagnostics when the preview exposes them.
- IndexedDB persistence for workspace state, checkpoints, and recent activity.
- Landing, dashboard, and travel-planner starters.
- Automatic pre-mutation checkpoints and user-created checkpoints.
- Exact checkpoint restoration and deterministic demo reset.
- ZIP export preparation and a user-triggered download.
- A compact activity history that records metadata, never file contents.
- Laptop and tablet layouts, plus compact tabs for narrower screens.
- Graceful operation without WebMCP, with a discreet availability message.
- Imperative WebMCP registration from the top-level document only.
- Stable `?demo=landing`, `?demo=dashboard`, and `?demo=travel` entry points.

## Deliberate non-goals

The challenge MVP does not include:

- An embedded chatbot or a direct OpenAI API call.
- A request for an OpenAI API key.
- A separate MCP server or Codex app-server integration.
- Arbitrary package installation, shell access, or command execution.
- User accounts, a project backend, cloud workspace synchronization, or private GitHub access.
- Large-repository import or deployment of user-created projects.
- A control-tower approval workflow.

## Demo starters

### Landing

A compact SaaS page that is correct but intentionally plain. It is the deterministic baseline for the Roamly transformation.

### Dashboard

A small operational dashboard with summary cards, a local data table, and non-networked filters.

### Travel planner

A visual itinerary with original local sample data and no external travel service dependency.

Each starter must compile at rest, remain small enough to read in a few tool calls, and reset byte-for-byte to its bundled source snapshot.

## Experience principles

- **Shared state:** Human UI and WebMCP handlers call the same domain services.
- **Visible causality:** Mutations surface revision, affected paths, checkpoint, and activity.
- **Calm density:** The workspace is productive without resembling a terminal or compliance dashboard.
- **Reversible by default:** Content mutations create a checkpoint before they commit.
- **Honest diagnostics:** Preview inspection reports available compiler/runtime signals, not invented visual understanding.
- **Local-first privacy:** Project data remains in the browser unless the user explicitly downloads it.
- **Human fallback:** Every essential workflow remains available when Site Tools are absent.

## Interaction model

### Desktop

- Compact top bar: Patchwork mark, project name, save status, Site Tools status, checkpoint, reset, and export.
- Left rail: starters and file tree.
- Center: active-file editor.
- Right rail: preview and diagnostics.
- Collapsible bottom area: recent activity.

### Narrow screens

Use named tabs for Files, Code, Preview, and Activity. Preserve keyboard focus, button labels, and the active project state when changing tabs.

### Required states

- Loading and local-data restoration.
- Empty workspace or no active file.
- Recoverable persistence failure.
- Site Tools unavailable.
- Preview compiling, ready, or in error.
- Checkpoint created or restored.
- Manual delete confirmation.
- Export ready or blocked by validation.

## Accessibility baseline

- Semantic landmarks and named controls.
- Visible keyboard focus.
- Keyboard access to the primary navigation and actions.
- Labels for editor, file tree, preview, diagnostics, and activity.
- Reasonable WCAG contrast.
- No information conveyed by color alone.
- Motion reduced or removed when `prefers-reduced-motion` is active.

## Success criteria

The build is acceptable only when a user can load a starter, edit a file, observe the preview, create and restore a checkpoint, reset the demo exactly, reload persisted state, and export the project. WebMCP acceptance additionally requires top-level single registration, side-effect-free reads, atomic checkpointed writes, structured repairable errors, and immediate UI synchronization.

Public URL, repository visibility, video duration, actual ChatGPT testing, and automated validation results are release facts and must be recorded only after verification.
