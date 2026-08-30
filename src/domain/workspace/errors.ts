export type DomainErrorCode =
  | "INVALID_PATH"
  | "UNSUPPORTED_FILE_TYPE"
  | "FILE_NOT_FOUND"
  | "PATH_COLLISION"
  | "REVISION_CONFLICT"
  | "FILE_TOO_LARGE"
  | "BATCH_TOO_LARGE"
  | "WORKSPACE_TOO_LARGE"
  | "TOO_MANY_FILES"
  | "CHECKPOINT_NOT_FOUND"
  | "CHECKPOINT_LIMIT_REACHED"
  | "NO_CHANGES"
  | "NOT_READY"
  | "PERSISTENCE_FAILED";

export interface DomainError {
  code: DomainErrorCode;
  message: string;
  field?: string;
  path?: string;
  currentRevision?: number;
  retryable: boolean;
  suggestion?: string;
}

export type Result<T> =
  { ok: true; value: T } | { ok: false; error: DomainError };

export const success = <T>(value: T): Result<T> => ({ ok: true, value });
export const failure = (error: DomainError): Result<never> => ({
  ok: false,
  error,
});

export const persistenceFailure = (): DomainError => ({
  code: "PERSISTENCE_FAILED",
  message: "The workspace could not be saved locally.",
  retryable: true,
  suggestion:
    "Retry the operation. If it continues to fail, check browser storage availability.",
});
