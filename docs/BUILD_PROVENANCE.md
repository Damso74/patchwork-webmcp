# Build provenance

## Project status

- **Real start date:** August 30, 2026
- **Context:** new project created during the WebMCP Challenge submission window
- **Repository:** [github.com/Damso74/patchwork-webmcp](https://github.com/Damso74/patchwork-webmcp), with new standalone Git history; no ArcadeOps or other project history copied
- **License:** MIT
- **Primary language:** TypeScript with strict compiler settings
- **Public release:** `v1.0.3-webmcp-challenge` at `6090a4a2a97a889f51dfa61c99faaf374313e098`
- **Production deployment:** Vercel `dpl_9pGYocF1EByTZikSDXdofykUcTY4`, `READY`, exact release commit

## Technical choices

- Vite, React 19, and TypeScript for a static browser application.
- CodeSandbox Sandpack for the isolated React/TypeScript editor and live preview.
- A pure workspace domain shared by human UI and WebMCP handlers.
- IndexedDB through `idb`, with workspace, checkpoint, and activity records committed transactionally.
- JSZip for browser-only export.
- Vitest, Testing Library, fake-indexeddb, and Playwright for verification.
- Vercel static hosting; no backend, database service, account, or OpenAI API integration.

## Main dependencies

See `package-lock.json` for the exact reproducible graph.

| Dependency                    | Purpose                             |
| ----------------------------- | ----------------------------------- |
| `react`, `react-dom`          | Host UI                             |
| `@codesandbox/sandpack-react` | Editor and isolated preview runtime |
| `idb`                         | Typed IndexedDB access              |
| `jszip`                       | Local ZIP preparation               |
| `lucide-react`                | Accessible interface icons          |
| `vitest`, Testing Library     | Unit/integration tests              |
| `@playwright/test`            | Browser and deployed smoke tests    |

## Asset provenance

- Patchwork mark: original CSS/SVG geometry created for this project.
- Starter UI, copy, data, CSS art, and illustrative maps: original project content.
- Lucide icons: used under the Lucide ISC license through the npm package.
- No OpenAI marks, copied interfaces, stock images, copyrighted music, or remote commercial assets.
- Starters use only system font stacks; the final Relay starter no longer makes a Google Fonts request.
- English-language narration was generated on 2026-08-31 with ElevenLabs `Eric — Smooth, Trustworthy` in Multilingual v2. The 1,189-character generation used speed `0.96`, stability `0.65`, and similarity `0.80`. No voice was created, replaced, renamed, or deleted.
- The 16:9 thumbnail was generated specifically for Patchwork with OpenAI image generation, then edited through the same workflow for exact typography. It contains no OpenAI mark or copied interface.
- The final 90-second walkthrough contains no music, has burned English captions, and is normalized to approximately -16 LUFS. Its persistent Playwright-adapter label and machine-readable proof keep the automated footage distinct from native Codex in-app-browser evidence.

## Natural commit history

The final list is generated from real commits and must not be backdated or rewritten. Current sequence:

1. `chore: scaffold patchwork web app`
2. `feat: add persistent browser workspace`
3. `docs: capture challenge requirements and product design`
4. `feat: add workspace UI previews and webmcp tools`
5. `test: verify webmcp contracts and golden path`
6. `fix: harden workspace and preview boundaries`
7. `docs: prepare challenge submission and demo`
8. `test: verify public release candidate`
9. `chore: ignore vercel local metadata`
10. `fix: synchronize preview diagnostics for site tools`
11. `docs: finalize recording runbook`
12. `docs: record native release verification`
13. `fix: prevent sandpack feedback writes`
14. `docs: record native Roamly rehearsal`
15. `docs: produce the under-two-minute demo kit`
16. `chore: exclude local video artifacts from deploys`
17. `docs: make demo narration evidence accurate`
18. `feat: sharpen webmcp workspace feedback`
19. `docs: finalize captioned demo package`
20. `docs: finalize public submission handoff`
21. `docs: publish video and submission links [skip vercel]`
22. `docs: seal publication handoff [skip vercel]`

Commits 1–22 and their immutable identifiers are available in the public repository history. Commits 20–22 record the submission handoff, verified public video, and complete 4/5 Devpost draft. The opt-in Vercel ignore token publishes documentation without replacing the already verified release deployment. No commit was backdated or rewritten.

## Validation truth gate

Only results captured in [VERIFICATION.md](VERIFICATION.md) after actual commands are treated as passed. A local build, HTTP 200, browser harness, Vercel deployment, native Codex Site Tools run, manual ChatGPT run, and public video are separate evidence states.
