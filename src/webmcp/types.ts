import type { WorkspaceFacade } from "../services/persistence";

export interface PreviewDiagnostic {
  severity: "error" | "warning";
  message: string;
  path?: string;
  line?: number;
}

export interface PreviewSnapshot {
  status: "idle" | "compiling" | "ready" | "error" | "unavailable";
  errors: PreviewDiagnostic[];
  warnings: PreviewDiagnostic[];
  summary: string;
  renderedRevision?: number;
  renderedAt?: string;
}

export type PreviewReader = () => PreviewSnapshot;

export interface JsonSchema {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties: false;
}

export interface ToolAnnotations {
  readOnlyHint: boolean;
  untrustedContentHint?: boolean;
}

export interface WebMCPToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: JsonSchema;
  annotations: ToolAnnotations;
  execute: (
    input: Record<string, unknown>,
    options?: { signal?: AbortSignal },
  ) => Promise<unknown>;
}

export interface ModelContextLike {
  registerTool: (
    tool: WebMCPToolDefinition,
    options?: { signal?: AbortSignal },
  ) => Promise<unknown> | unknown;
}

export interface ToolError {
  code: string;
  message: string;
  field?: string;
  path?: string;
  currentRevision?: number;
  retryable: boolean;
  suggestion?: string;
}

export interface ToolEnvelope<T = unknown> {
  ok: boolean;
  tool: string;
  revision: number;
  data?: T;
  error?: ToolError;
  warnings: string[];
  timestamp: string;
}

export interface ToolFactoryContext {
  facade: WorkspaceFacade;
  getPreview: PreviewReader;
  now?: () => string;
}

declare global {
  interface Document {
    modelContext?: ModelContextLike;
  }
}
