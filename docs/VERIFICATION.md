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
| E2E laptop/tablet | `npm run test:e2e`         | Passed | 14 Playwright scenarios passed across laptop and tablet       |
| Secret scan       | `npm run scan:secrets`     | Passed | 75 files scanned on 2026-08-30                                |
| Dependency audit  | `npm run audit:deps`       | Passed | npm reported 0 vulnerabilities on 2026-08-30                  |

## Browser and release evidence

| Evidence                                     | Status  | Notes                                            |
| -------------------------------------------- | ------- | ------------------------------------------------ |
| Local production browser smoke               | Passed  | Playwright exercised the Vite production preview |
| Public unauthenticated HTTP                  | Not run | Pending deployment                               |
| Public starter/reset/export smoke            | Not run | Pending deployment                               |
| Public console error scan                    | Not run | Pending deployment                               |
| Exact GitHub/Vercel commit match             | Not run | Pending publication                              |
| Real ChatGPT built-in browser Site Tools run | Not run | Must not be inferred from the Playwright adapter |

## Security review

A sealed whole-repository security scan on the pre-fix commit identified four medium/low boundary issues: checkpoint response over-sharing, missing runtime validation of persisted records, an optimistic-revision race, and an over-permissive preview iframe. All four were fixed. Regression coverage now verifies metadata-only checkpoint results, corrupted IndexedDB recovery, strict revisions with retained later edits, same-starter restore, and the exact preview sandbox.

## Required manual ChatGPT run

Follow [DEMO_RUNBOOK.md](DEMO_RUNBOOK.md) in the latest ChatGPT desktop app with GPT-5.6 Sol or Terra. Record the date, app version, account/workspace type, prompt, discovered tool count, calls, revision, files changed, preview status, and whether a restore/export was completed.
