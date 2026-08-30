# Verification record

This document is updated from actual command output. `Passed` is never used for an unexecuted check.

## Local automated checks

| Check             | Command                    | Status | Evidence                                                      |
| ----------------- | -------------------------- | ------ | ------------------------------------------------------------- |
| Lint              | `npm run lint`             | Passed | oxlint completed without findings on 2026-08-30               |
| Format            | `npm run format:check`     | Passed | Prettier reported all files formatted on 2026-08-30           |
| TypeScript        | `npm run typecheck`        | Passed | strict project references completed on 2026-08-30             |
| Unit tests        | `npm run test:unit`        | Passed | included in the final 46-test Vitest run on 2026-08-30        |
| Integration tests | `npm run test:integration` | Passed | included in the final 46-test Vitest run on 2026-08-30        |
| Production build  | `npm run build`            | Passed | Vite production build completed; size warning is non-blocking |
| E2E laptop/tablet | `npm run test:e2e`         | Passed | 16 Playwright scenarios passed across laptop and tablet       |
| Secret scan       | `npm run scan:secrets`     | Passed | 72 source files scanned on 2026-08-30                         |
| Dependency audit  | `npm run audit:deps`       | Passed | npm reported 0 vulnerabilities on 2026-08-30                  |

## Browser and release evidence

| Evidence                                      | Status  | Notes                                                                         |
| --------------------------------------------- | ------- | ----------------------------------------------------------------------------- |
| Local production browser smoke                | Passed  | Playwright exercised the Vite production preview                              |
| Public unauthenticated HTTP                   | Passed  | GitHub and Vercel returned HTTP 200                                           |
| Public starter/reset/export smoke             | Passed  | 16/16 Playwright checks at the production alias                               |
| Public console error scan                     | Passed  | No console/page errors in the bounded public run                              |
| Exact GitHub/Vercel commit match              | Passed  | Vercel deployment metadata matched the pushed `main` SHA                      |
| Native in-app discovery and read-only preview | Passed  | 10 tools; UI, context, and `inspect_preview` all reported `ready`             |
| Native production mutation and stability      | Passed  | Two-file atomic write, visible preview update, one revision, stable after 5 s |
| Clean-profile canonical recording take        | Not run | Reserved for the actual screen recording in a fresh browser context           |

## Security review

A sealed whole-repository security scan on the pre-fix commit identified four medium/low boundary issues: checkpoint response over-sharing, missing runtime validation of persisted records, an optimistic-revision race, and an over-permissive preview iframe. All four were fixed. Regression coverage now verifies metadata-only checkpoint results, corrupted IndexedDB recovery, strict revisions with retained later edits, same-starter restore, and the exact preview sandbox.

The first public run used 12 parallel workers and finished 12/16 because Sandpack remained in `compiling` for some network-bound checks; one new assertion also targeted the wrong semantic role. After correcting only that assertion and bounding the public run to two workers, all 16 checks passed. The final smoke command was `PATCHWORK_BASE_URL=https://patchwork-webmcp.vercel.app npx playwright test --workers=2`.

The native preflight then revealed that the visible UI reported `Preview ready` while WebMCP still classified Sandpack's `running` state as `compiling`. Release 1.0.1 unifies that state mapping. A regression test now waits for the real component state and invokes the production `inspect_preview` handler. The deployed in-app-browser retest returned `ready`, `renderedRevision: 0`, no diagnostics, and no console warnings or errors.

The first full Roamly rehearsal against release 1.0.1 exposed a separate production-only feedback bug: after a native WebMCP write, a stale Sandpack editor buffer could be mistaken for a human edit and repeatedly create workspace revisions. That rehearsal is recorded as failed evidence, not as a pass. Release 1.0.2 makes the workspace state authoritative for programmatic synchronization, permits domain writes only after actual editor input, and retries preview synchronization once the Sandpack client is ready. The E2E regression asserts that a native-handler write remains at exactly one new revision and that an invalid Site Tools write reaches preview diagnostics before a repair clears it.

Production release 1.0.2 was then verified in the Codex in-app browser on 2026-08-30. All 10 top-level tools were discovered. The persisted Roamly project rendered successfully, `read_files` observed revision 1247, `create_checkpoint` preserved that revision, and one atomic `write_files` call changed `src/App.tsx` plus `src/styles.css` at revision 1248. The new CTA was visible in the preview, `inspect_preview` returned `ready` with `renderedRevision: 1248` and no diagnostics, and two context reads five seconds apart both remained at revision 1248. Deployment `dpl_J2daFX9Sm6JTSQm3ZAwuoBLiAbVK` was `READY` on the Hobby plan and reported Git commit `252d3a83a77d2891464818c99e5039b18c57e210`.

## Required manual ChatGPT run

Follow [DEMO_RUNBOOK.md](DEMO_RUNBOOK.md) in a fresh browser context in the latest ChatGPT desktop app with GPT-5.6 Sol or Terra. Record the date, app version, account/workspace type, prompt, discovered tool count, calls, revision, files changed, preview status, and whether a restore/export was completed. The fresh context matters because the development rehearsal profile intentionally retains its local IndexedDB evidence.
