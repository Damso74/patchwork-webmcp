import JSZip from "jszip";
import type { WorkspaceState } from "../../domain/workspace/types";

export const buildProjectZip = async (state: WorkspaceState): Promise<Blob> => {
  const archive = new JSZip();
  const stableDate = new Date(state.updatedAt);
  for (const file of Object.values(state.files).sort((a, b) =>
    a.path.localeCompare(b.path),
  )) {
    archive.file(file.path, file.content, {
      date: stableDate,
      createFolders: true,
    });
  }
  return archive.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
};
