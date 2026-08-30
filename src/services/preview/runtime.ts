import type { PreviewSnapshot } from "../../webmcp";

let snapshot: PreviewSnapshot = {
  status: "idle",
  errors: [],
  warnings: [],
  summary: "The preview runtime has not reported a build yet.",
};

export const getPreviewSnapshot = (): PreviewSnapshot =>
  structuredClone(snapshot);

export const setPreviewSnapshot = (next: PreviewSnapshot): void => {
  snapshot = structuredClone(next);
};
