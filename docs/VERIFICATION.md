# Verification record

This document is updated from actual command output. `Passed` is never used for an unexecuted check.

## Local automated checks

| Check             | Command                    | Status | Evidence                                                      |
| ----------------- | -------------------------- | ------ | ------------------------------------------------------------- |
| Lint              | `npm run lint`             | Passed | oxlint completed without findings on 2026-08-31               |
| Format            | `npm run format:check`     | Passed | Prettier reported all files formatted on 2026-08-31           |
| TypeScript        | `npm run typecheck`        | Passed | strict project references completed on 2026-08-31             |
| Unit tests        | `npm run test:unit`        | Passed | 54 unit tests passed on 2026-08-31                            |
| Integration tests | `npm run test:integration` | Passed | included in the final 64-test Vitest run on 2026-08-31        |
| Production build  | `npm run build`            | Passed | Vite production build completed; size warning is non-blocking |
| E2E laptop/tablet | `npm run test:e2e`         | Passed | 26 Playwright scenarios passed across laptop and tablet       |
| Secret scan       | `npm run scan:secrets`     | Passed | 87 source files scanned on 2026-08-31                         |
| Dependency audit  | `npm run audit:deps`       | Passed | npm reported 0 vulnerabilities on 2026-08-31                  |

## Browser and release evidence

The rows below describe public release `v1.0.3-webmcp-challenge` at commit `6090a4a2a97a889f51dfa61c99faaf374313e098`, except where an earlier rehearsal is labeled explicitly.

| Evidence                                       | Status  | Notes                                                                            |
| ---------------------------------------------- | ------- | -------------------------------------------------------------------------------- |
| Local production browser smoke                 | Passed  | Playwright exercised the Vite production preview                                 |
| Public unauthenticated HTTP                    | Passed  | GitHub and Vercel returned HTTP 200                                              |
| Public starter/reset/export smoke              | Passed  | 26/26 Playwright checks at the production alias on 2026-09-01                    |
| Public console error scan                      | Passed  | No console/page errors in the bounded public run                                 |
| Exact GitHub/Vercel commit match               | Passed  | Vercel deployment metadata matched the pushed `main` SHA                         |
| Native in-app discovery and read-only preview  | Passed  | 10 tools; UI, context, and `inspect_preview` all reported `ready`                |
| Native v1.0.3 mutation, restore, and stability | Passed  | One-file write at revision 1, explicit restore at revision 2, stable and ready   |
| Historical v1.0.2 clean-origin rehearsals      | Passed  | Two fresh origins completed three-file Roamly writes at revision 0 → 1           |
| Labeled automated walkthrough                  | Passed  | Same registered handlers; clean profile; proof receipt; 0 preview diagnostics    |
| Final 1080p video encode                       | Passed  | 1:30.000, burned captions, persistent adapter label, audio at -16.51 LUFS        |
| Public 1.0.3 production deployment             | Passed  | Vercel `READY`; deployment `dpl_9pGYocF1EByTZikSDXdofykUcTY4`; exact SHA         |
| Public video publication and signed-out play   | Not run | Older private upload is superseded; new labeled master still needs public upload |

The public release receipt verifies the GitHub release, anonymous validation-pack hash, Vercel production deployment and exact commit, 26 laptop/tablet checks, three clean-browser starter renders with zero console errors, and the native WebMCP receipt. See [`PUBLIC_RELEASE_RECEIPT.json`](https://github.com/Damso74/patchwork-webmcp/releases/download/v1.0.3-webmcp-challenge/PUBLIC_RELEASE_RECEIPT.json).

## Security review

A sealed whole-repository security scan on the pre-fix commit identified four medium/low boundary issues: checkpoint response over-sharing, missing runtime validation of persisted records, an optimistic-revision race, and an over-permissive preview iframe. All four were fixed. Regression coverage now verifies metadata-only checkpoint results, corrupted IndexedDB recovery, strict revisions with retained later edits, same-starter restore, and the exact preview sandbox.

The 2026-08-31 pre-recording review found two additional persistence edge cases. A second edit could be lost if it arrived while an earlier asynchronous flush was committing, and an altered checkpoint row did not receive the same complete runtime validation as a workspace row. Both are fixed. Deterministic regressions now prove sequential revision-safe draining of concurrent edits and rejection of corrupted checkpoint identity, starter, revision, files, paths, and quotas without any mutation.

The final race review then removed the remaining demo hazards: a newer edit is retried after a transient in-flight failure without weakening its expected revision; Reset waits for the complete edit drain; simultaneous `fresh=1` pages receive separate databases; an immediate WebMCP mutation still receives a bounded receipt; later metadata no longer leaves that receipt visible indefinitely; and `inspect_preview` publishes a rendered revision only after the matching Sandpack compilation and iframe cycle are complete.

The first public run used 12 parallel workers and finished 12/16 because Sandpack remained in `compiling` for some network-bound checks; one new assertion also targeted the wrong semantic role. After correcting only that assertion and bounding the public run to two workers, all 16 checks passed. The final smoke command was `PATCHWORK_BASE_URL=https://patchwork-webmcp.vercel.app npx playwright test --workers=2`.

The native preflight then revealed that the visible UI reported `Preview ready` while WebMCP still classified Sandpack's `running` state as `compiling`. Release 1.0.1 unifies that state mapping. A regression test now waits for the real component state and invokes the production `inspect_preview` handler. The deployed in-app-browser retest returned `ready`, `renderedRevision: 0`, no diagnostics, and no console warnings or errors.

The first full Roamly rehearsal against release 1.0.1 exposed a separate production-only feedback bug: after a native WebMCP write, a stale Sandpack editor buffer could be mistaken for a human edit and repeatedly create workspace revisions. That rehearsal is recorded as failed evidence, not as a pass. Release 1.0.2 makes the workspace state authoritative for programmatic synchronization, permits domain writes only after actual editor input, and retries preview synchronization once the Sandpack client is ready. The E2E regression asserts that a native-handler write remains at exactly one new revision and that an invalid Site Tools write reaches preview diagnostics before a repair clears it.

Production release 1.0.2 was then verified in the Codex in-app browser on 2026-08-30. All 10 top-level tools were discovered. The persisted Roamly project rendered successfully, `read_files` observed revision 1247, `create_checkpoint` preserved that revision, and one atomic `write_files` call changed `src/App.tsx` plus `src/styles.css` at revision 1248. The new CTA was visible in the preview, `inspect_preview` returned `ready` with `renderedRevision: 1248` and no diagnostics, and two context reads five seconds apart both remained at revision 1248. Deployment `dpl_J2daFX9Sm6JTSQm3ZAwuoBLiAbVK` was `READY` on the Hobby plan and reported Git commit `252d3a83a77d2891464818c99e5039b18c57e210`.

Two subsequent clean-origin native runs completed the canonical Roamly transformation at revision 0 → 1. Each run created the requested manual checkpoint, changed `src/App.tsx`, `src/content.ts`, and `src/styles.css` in one atomic write, rendered the new preview, and returned `ready` with no errors or warnings. The revision remained stable after completion.

The first 2026-08-31 polish capture was rejected during frame review because the editor had changed to Roamly while the iframe still displayed Relay. State-only checks were insufficient. Patchwork now remounts the preview from the authoritative workspace after agent mutations, restores, and resets while preserving the normal human-editing instance. The E2E contract requires the real `Roamly` heading after a Site Tools write and the real Relay heading after restore.

The final automated walkthrough was then produced from a fresh isolated `fresh=1` Playwright profile against the local release candidate. The adapter was injected before load and captured the exact ten definitions registered by the application; it did not provide a second handler implementation. The recording itself now blocks until `Go farther. Feel closer.` is visible inside the Sandpack iframe. Its proof receipt records revision 0 reads, a manual checkpoint, one automatic checkpoint, a three-file atomic write at revision 1, `inspect_preview` at rendered revision 1, and zero application console errors. The capture locally returns an empty response only for CodeSandbox's `col.csbops.io/data/sandpack` telemetry endpoint and records every such suppression in the proof JSON; any other console error fails the take.

The final local encode is 90.000 seconds at 1920×1080 with H.264 video, normalized AAC narration, burned English captions, and a persistent **Automated adapter walkthrough — not ChatGPT footage** label. Visual samples at 0, 30, 60, and 89 seconds confirm that label; the earlier content review at 58, 68, 80, and 90 seconds confirms the WebMCP receipt, Roamly in the editor and iframe, Focus Preview, diagnostics, checkpoint restore controls, and end card. FFmpeg decoded the complete labeled file without error. Measured loudness remains -16.51 LUFS with a -0.72 dB true peak because its AAC stream was copied unchanged. SHA-256: `1AE559538600C5C511141A26D91C3F1489309AD17C4112F7978C522F9BB5EC1E`.

Public release 1.0.3 was verified natively in the Codex in-app browser on 2026-08-31. Ten top-level tools were discovered. Reads and a manual checkpoint preserved revision 0, an atomic write committed revision 1 with a matching ready preview, an explicit restore produced revision 2 with the original heading, and the revision remained stable with zero browser console errors. This is native Codex evidence, not a manual ChatGPT run or video footage.

## Required manual ChatGPT run

**Status: Not run.** Native Codex in-app-browser evidence and the Playwright adapter evidence above do not replace this separate manual run.

Follow [DEMO_RUNBOOK.md](DEMO_RUNBOOK.md) in a fresh browser context in the latest ChatGPT desktop app with GPT-5.6 Sol or Terra. Record the date, app version, account/workspace type, prompt, discovered tool count, calls, revision, files changed, preview status, and whether a restore/export was completed. The fresh context matters because the development rehearsal profile intentionally retains its local IndexedDB evidence.
