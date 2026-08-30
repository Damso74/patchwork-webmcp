export const WORKSPACE_LIMITS = {
  maxPathBytes: 180,
  maxSegmentBytes: 80,
  maxFiles: 80,
  maxFileBytes: 256 * 1024,
  maxWriteBatchFiles: 12,
  maxWriteBatchBytes: 768 * 1024,
  maxWorkspaceBytes: 2 * 1024 * 1024,
  maxReadBatchFiles: 12,
  maxReadResultBytes: 512 * 1024,
  maxActivityEntries: 200,
  maxAutomaticCheckpoints: 20,
  maxManualCheckpoints: 10,
} as const;

export const ALLOWED_TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".html",
  ".md",
  ".txt",
  ".svg",
]);

export const ALLOWED_EXTENSIONLESS_FILES = new Set([".gitignore"]);

export const FORBIDDEN_SENSITIVE_NAMES =
  /(^|\/)(\.env(?:\..*)?|.*\.(?:pem|key|p12|pfx|jks|keystore))$/i;

export const utf8Size = (value: string): number =>
  new TextEncoder().encode(value).byteLength;
