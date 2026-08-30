# WebMCP Challenge requirements

Verified against the official sources on **August 30, 2026**. The official rules and challenge website take precedence over this summary.

## Deadline and submission window

- Registration and submission: August 25, 2026 at 11:00 AM Pacific Time through **September 3, 2026 at 1:00 PM PDT**.
- Exact deadline conversion: **September 3, 2026 at 20:00 UTC / 22:00 Europe/Berlin (CEST)**.
- Judging: September 4, 2026 at 10:00 AM PT through September 21, 2026 at 5:00 PM PT.
- Winners: on or around September 23, 2026 at 2:00 PM PT.
- Conservative freeze rule: after the deadline, do not edit the submitted Devpost entry, repository, or live site until winners are announced. Continue only in a separate fork.

## Eligibility

Eligible entrants may be individuals, teams, or organizations. Individuals must have reached the legal age of majority where they reside, live in a territory supported for OpenAI API access, and not fall into an excluded jurisdiction or conflict category. Teams and organizations must appoint an eligible representative. Organizations must be organized in a supported jurisdiction.

The overview explicitly excludes Belarus, Brazil, China, Crimea, Cuba, Donetsk, Hong Kong, Iran, North Korea, Luhansk, Quebec, Russia, Syria, and Venezuela. The rules also apply broader legal, OFAC, promotion-entity, judge, affiliate, family, household, and conflict exclusions. Final eligibility is a personal legal attestation that Patchwork cannot make for the entrant.

## Required project and deliverables

The entry must be a functional WebMCP-powered web application that explores collaboration between people and agents on the open web. It must run consistently on its intended platform and behave as shown in its video and description.

The submission must include:

- A working live URL accessible in ChatGPT's in-app browser or Chrome 149+ with WebMCP testing enabled.
- An English description covering WebMCP fit, user experience, the new human-agent collaboration, and the implementation.
- A public GitHub, GitLab, or Bitbucket repository with all required source, assets, setup instructions, and a visible open-source license.
- A public YouTube demonstration video strictly under three minutes.
- Clear testing instructions and working credentials if the app is authenticated.

The project must remain available free of charge for judging. There is no official minimum tool count; the implementation must nevertheless be genuine, working, and non-trivial.

## Video

- Strictly less than `03:00`; judges do not need to watch beyond three minutes.
- Publicly visible on YouTube.
- A clear working demo with audio explaining what was built and how WebMCP is used.
- No unlicensed music, third-party marks, or protected material.
- Must match the submitted build. Patchwork targets `02:30–02:45`.

## Repository, license, and provenance

- The source repository must be public; there is no private-repository alternative.
- MIT satisfies the stated open-source requirement.
- The license should be detected and visible at the top of the repository/About area.
- A new project must have been created within the submission window. An existing project is eligible only if meaningfully extended with WebMCP after August 25, 2026 at 11:00 AM PT, with dated evidence distinguishing old and new work.
- Patchwork is a new repository with natural, current commit dates. No history was copied or backdated.
- The Devpost `search_products` code is illustrative. The material requirement is a real imperative `document.modelContext.registerTool(...)` implementation.

## Judging

Stage one is pass/fail for theme fit and genuine use of the required technology. Stage two scores four equally weighted criteria:

1. **WebMCP Leverage** — thorough, skillful, working, non-trivial WebMCP use.
2. **Execution** — a coherent runnable product, not only a technical proof.
3. **Potential Impact** — a credible solution to a specific problem and audience.
4. **Creativity & Ambition** — novelty and meaningful differentiation.

## Current Site Tools constraints

ChatGPT Site Tools are ChatGPT's implementation of the proposed WebMCP standard. Patchwork follows the current supported subset:

- Feature-detect `document.modelContext?.registerTool`.
- Register imperatively with JavaScript in the **top-level document**.
- Do not register from Sandpack's same-origin or cross-origin iframe; iframe tools are not discovered.
- Do not depend on declarative HTML/form registration; it is not supported as Site Tools.
- Use narrow input schemas, accurate side-effect descriptions, verifiable results, and the application's existing validation and permissions.
- Preserve a complete human UI and graceful fallback when WebMCP is unavailable.
- Treat tool definitions and results as untrusted content. Browser safety review does not replace authorization and confirmation policy.

Tools are page-scoped. The current official guide recommends GPT-5.6 Sol or Terra; Luna has Site Tools disabled. Availability requires a current ChatGPT desktop app, depends on rollout, and is not available in Enterprise or Edu workspaces. Chrome testing requires Chrome 149+ with `chrome://flags/#enable-webmcp-testing`.

Codex app-server is a deeper embedded-client integration surface for authentication, conversations, approvals, and streamed events. It is neither required nor appropriate for Patchwork's local-first, browser-native MVP.

## Brand rules

- Patchwork must not imply sponsorship, endorsement, partnership, or official status.
- Patchwork's own name and visual identity stay more prominent than OpenAI references.
- No OpenAI logo, imitation, modification, or incorporation into the Patchwork mark.
- No OpenAI, ChatGPT, Codex, GPT, or model name in the app/product/company name.
- Descriptive references must be accurate and accompanied by the disclaimer: **“Patchwork is an independent project and is not affiliated with or endorsed by OpenAI.”**

## Conservative resolution of ambiguities

- One FAQ sentence says “Since there's no video,” contradicting the overview, rules, and another FAQ entry. It is treated as a typo; the public audio-enabled video is mandatory.
- “PDT” and “Pacific Time” produce the same deadline because Los Angeles observes daylight time on September 3.
- The explicit territory list and broader legal/API-support test are applied cumulatively.
- The challenge FAQ warns against altering repository or live site during judging, so Patchwork follows that stricter freeze.

## Official sources

- [Challenge overview](https://webmcp.devpost.com/)
- [Official rules](https://webmcp.devpost.com/rules)
- [Resources and FAQ](https://webmcp.devpost.com/resources)
- [OpenAI Site Tools guide](https://learn.chatgpt.com/docs/webmcp)
- [OpenAI supported countries](https://developers.openai.com/api/docs/supported-countries)
- [OpenAI brand guidelines](https://openai.com/brand/)
- [Codex open-source components](https://learn.chatgpt.com/docs/open-source)
- [Codex app-server reference](https://learn.chatgpt.com/docs/app-server)
- [OpenAI developer showcase](https://developers.openai.com/showcase?view=webmcp-apps)
- [WebMCP specification](https://webmachinelearning.github.io/webmcp/)
- [Chrome WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp)
