# Video asset provenance

## Narration

- File: `patchwork-narration-elevenlabs.mp3`
- Generated: 2026-08-31 with **Eric — Smooth, Trustworthy**, an English-language ElevenLabs voice, in Eleven Multilingual v2
- Settings: speed `0.96`, stability `0.65`, similarity `0.80`, speaker boost enabled
- Measured duration: 84.611 seconds
- Audio: 44.1 kHz mono, 128 kbit/s MP3
- SHA-256: `8BD458334E1FE5CA553D69DE7706E38E21272D0A2D032E00022986D6F9DC812D`
- Text: the six narration paragraphs in `docs/VIDEO_SCRIPT.md`
- The generation used 1,189 characters. No voice was created, replaced, renamed, or deleted.

## Thumbnail

- File: `patchwork-video-thumbnail.png`
- Generated with OpenAI image generation and edited through the same image-generation workflow for exact typography
- SHA-256: `9ED26F8689DDA4530EA2802218852D192018060BFD52FC7CFA7B0EBC8F07D826`
- Composition: Patchwork code workspace, woven collaboration motif, and a warm Indonesian travel preview
- Text: `PATCHWORK` and `THE PAGE BECOMES THE TOOL`
- No OpenAI logo, ChatGPT interface imitation, stock asset, or third-party mark is used.

## Walkthrough

Run `npm run record:demo` to generate a 1920×1080 Playwright walkthrough in `artifacts/video/`. The recording injects the documented test adapter before page load, captures the page's ten registered handlers, waits for the actual Roamly heading inside the Sandpack iframe, and writes a machine-readable proof receipt beside the raw video. The overlay labels the take as automated.

The deterministic recording URL adds `fresh=1`, which uses an isolated IndexedDB namespace and never replaces the user's normal saved workspace. The recording locally suppresses only CodeSandbox's `col.csbops.io/data/sandpack` telemetry request and records that fact in the proof JSON; every other console error fails the take.

The final local encode is `artifacts/video/patchwork-demo-under-2min.mp4`: 90.000 seconds, 1920×1080 H.264, AAC narration normalized to approximately -16 LUFS, English captions burned into the image, and a persistent **Automated adapter walkthrough — not ChatGPT footage** label. Its SHA-256 is `1AE559538600C5C511141A26D91C3F1489309AD17C4112F7978C522F9BB5EC1E`.

The final local encode is intentionally ignored by Git because the submission links to a hosted video rather than storing a large binary in repository history. The labeled master is published at [https://youtu.be/Xxd2tr92WjM](https://youtu.be/Xxd2tr92WjM). YouTube reports Public visibility, no copyright issue, English (United States) language, and published English captions; unauthenticated oEmbed and watch-page checks succeeded on 2026-09-01.

No copyrighted music is included.
