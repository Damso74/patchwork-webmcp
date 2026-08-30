import { success, type Result } from "../../domain/workspace/errors";
import type { Revision, WorkspaceState } from "../../domain/workspace/types";

export interface ExportPreparation {
  ok: true;
  filename: string;
  revision: Revision;
  files: Array<{ path: string; sizeBytes: number }>;
  totalBytes: number;
  warnings: string[];
}

const safeFilename = (value: string): string => {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${slug || "patchwork-project"}.zip`;
};

export const prepareProjectExport = (
  state: WorkspaceState,
): Result<ExportPreparation> => {
  const files = Object.values(state.files)
    .sort((a, b) => a.path.localeCompare(b.path))
    .map(({ path, sizeBytes }) => ({ path, sizeBytes }));
  const warnings: string[] = [];
  if (files.length === 0) warnings.push("The project archive will be empty.");

  return success({
    ok: true,
    filename: safeFilename(state.projectId),
    revision: state.revision,
    files,
    totalBytes: files.reduce((total, file) => total + file.sizeBytes, 0),
    warnings,
  });
};
