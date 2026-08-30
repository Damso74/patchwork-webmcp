import { WORKSPACE_LIMITS } from "../domain/workspace";
import type { JsonSchema } from "./types";

const path = {
  type: "string",
  minLength: 1,
  maxLength: WORKSPACE_LIMITS.maxPathBytes,
  description:
    "A canonical project-relative POSIX path such as src/App.tsx. Never use an absolute path, backslash, URL, glob, or .. segment.",
};

const expectedRevision = {
  type: "integer",
  minimum: 0,
  description:
    "Optional current workspace revision. Supply the revision previously observed to prevent overwriting newer changes.",
};

export const schemas: Record<string, JsonSchema> = {
  get_workspace_context: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  list_files: {
    type: "object",
    properties: {
      prefix: {
        type: "string",
        maxLength: WORKSPACE_LIMITS.maxPathBytes,
        description: "Optional canonical relative path prefix.",
      },
    },
    additionalProperties: false,
  },
  read_files: {
    type: "object",
    properties: {
      paths: {
        type: "array",
        minItems: 1,
        maxItems: WORKSPACE_LIMITS.maxReadBatchFiles,
        uniqueItems: true,
        items: path,
        description:
          "Explicit text file paths to read. Read only the files needed for the current task.",
      },
    },
    required: ["paths"],
    additionalProperties: false,
  },
  write_files: {
    type: "object",
    properties: {
      writes: {
        type: "array",
        minItems: 1,
        maxItems: WORKSPACE_LIMITS.maxWriteBatchFiles,
        description:
          "The complete atomic write set. Every item is validated before any file changes.",
        items: {
          type: "object",
          properties: {
            path,
            content: {
              type: "string",
              maxLength: WORKSPACE_LIMITS.maxFileBytes,
              description: "Complete UTF-8 text content for the file.",
            },
          },
          required: ["path", "content"],
          additionalProperties: false,
        },
      },
      expectedRevision,
    },
    required: ["writes"],
    additionalProperties: false,
  },
  move_file: {
    type: "object",
    properties: { from: path, to: path, expectedRevision },
    required: ["from", "to"],
    additionalProperties: false,
  },
  delete_file: {
    type: "object",
    properties: { path, expectedRevision },
    required: ["path"],
    additionalProperties: false,
  },
  inspect_preview: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  create_checkpoint: {
    type: "object",
    properties: {
      label: {
        type: "string",
        minLength: 1,
        maxLength: 80,
        description:
          "Optional concise label describing the state being preserved.",
      },
    },
    additionalProperties: false,
  },
  restore_checkpoint: {
    type: "object",
    properties: {
      checkpointId: {
        type: "string",
        minLength: 1,
        maxLength: 100,
        description:
          "Exact checkpoint identifier returned by create_checkpoint or get_workspace_context.",
      },
      expectedRevision,
    },
    required: ["checkpointId"],
    additionalProperties: false,
  },
  prepare_project_export: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
};
