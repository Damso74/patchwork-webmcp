# Remaining manual actions

This file is reduced as automation completes. It never treats legal acceptance or an adapter-based test as a human confirmation.

## 1. Review the master and restore browser publication control — about 4 minutes

1. Play `artifacts/video/patchwork-demo-under-2min.mp4` once at 1× with sound. Confirm that the English narration is clear, the burned captions are readable, and the persistent **Automated adapter walkthrough — not ChatGPT footage** label is visible.
2. Reinstall the **Browser** plugin from the Codex plugin UI, open Chrome, then return to this task and say **Go publication**. The current diagnostic reports a missing native-host registry entry. Do not copy cookies or credentials and do not repair the registry manually.

After reconnection, automation will:

1. upload the newly labeled `artifacts/video/patchwork-demo-under-2min.mp4` as a new YouTube video, set the language to English, and add `docs/assets/video/patchwork-demo.en.srt`;
2. publish that new upload as **Public**; the older private upload `https://youtu.be/UmDFvW6sHHA` is superseded and must not be used for the submission;
3. verify the video signed out;
4. update the new public URL in the repository copy and refill the existing Devpost draft from `docs/DEVPOST_SUBMISSION.md`, save every page, reload it, and verify the thumbnail, gallery, team state, and field values without accepting terms.

## 2. Accept the rules and submit Devpost — about 2 minutes

1. Review the eligibility, publicity, IP, Official Rules, and Devpost Terms personally.
2. Confirm the entry is **Individual**, country of residence **France**, and no teammate is missing.
3. Check the terms box and click **Submit project** before September 3, 2026 at 13:00 PDT / 20:00 UTC / 22:00 Berlin.
4. Save the Devpost receipt. Do not edit the submitted repository, site, or entry during judging.

The release itself is complete: `v1.0.3-webmcp-challenge` is public, Vercel is `READY`, the repository is public with an MIT license, and the public application suite passes 26/26. The separate manual ChatGPT run remains `Not run`; it is recommended evidence, not an additional official submission field.
