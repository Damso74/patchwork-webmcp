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

| Evidence                                      | Status  | Notes                                                             |
| --------------------------------------------- | ------- | ----------------------------------------------------------------- |
| Local production browser smoke                | Passed  | Playwright exercised the Vite production preview                  |
| Public unauthenticated HTTP                   | Passed  | GitHub and Vercel returned HTTP 200                               |
| Public starter/reset/export smoke             | Passed  | 16/16 Playwright checks at the production alias                   |
| Public console error scan                     | Passed  | No console/page errors in the bounded public run                  |
| Exact GitHub/Vercel commit match              | Passed  | Vercel deployment metadata matched the pushed `main` SHA          |
| Native in-app discovery and read-only preview | Passed  | 10 tools; UI, context, and `inspect_preview` all reported `ready` |
| Full canonical Roamly mutation run            | Not run | Reserved for the unrecorded rehearsal or final recording          |

## Security review

A sealed whole-repository security scan on the pre-fix commit identified four medium/low boundary issues: checkpoint response over-sharing, missing runtime validation of persisted records, an optimistic-revision race, and an over-permissive preview iframe. All four were fixed. Regression coverage now verifies metadata-only checkpoint results, corrupted IndexedDB recovery, strict revisions with retained later edits, same-starter restore, and the exact preview sandbox.

The first public run used 12 parallel workers and finished 12/16 because Sandpack remained in `compiling` for some network-bound checks; one new assertion also targeted the wrong semantic role. After correcting only that assertion and bounding the public run to two workers, all 16 checks passed. The final smoke command was `PATCHWORK_BASE_URL=https://patchwork-webmcp.vercel.app npx playwright test --workers=2`.

The native preflight then revealed that the visible UI reported `Preview ready` while WebMCP still classified Sandpack's `running` state as `compiling`. Release 1.0.1 unifies that state mapping. A regression test now waits for the real component state and invokes the production `inspect_preview` handler. The deployed in-app-browser retest returned `ready`, `renderedRevision: 0`, no diagnostics, and no console warnings or errors.

## Required manual ChatGPT run

Follow [DEMO_RUNBOOK.md](DEMO_RUNBOOK.md) in the latest ChatGPT desktop app with GPT-5.6 Sol or Terra. Record the date, app version, account/workspace type, prompt, discovered tool count, calls, revision, files changed, preview status, and whether a restore/export was completed.
