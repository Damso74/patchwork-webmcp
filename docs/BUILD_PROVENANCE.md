# Build provenance

## Project status

- **Real start date:** August 30, 2026
- **Context:** new project created during the WebMCP Challenge submission window
- **Repository:** new standalone Git history; no ArcadeOps or other project history copied
- **License:** MIT
- **Primary language:** TypeScript with strict compiler settings

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
- Preview starter font requests, if present, use Google Fonts; the final submission video should avoid showing third-party branding.

## Natural commit history

The final list is generated from real commits and must not be backdated or rewritten. Current sequence:

1. `chore: scaffold patchwork web app`
2. `feat: add persistent browser workspace`
3. `docs: capture challenge requirements and product design`
4. `feat: add workspace UI previews and webmcp tools`
5. `test: verify webmcp contracts and golden path`

Security hardening and final release-documentation commits are appended after their successful verification. Exact immutable commit identifiers are available in the public repository history; no commit was backdated or rewritten.

## Validation truth gate

Only results captured in [VERIFICATION.md](VERIFICATION.md) after actual commands are treated as passed. A local build, HTTP 200, browser harness, Vercel deployment, and real ChatGPT Site Tools run are separate evidence states.
