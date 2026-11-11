export type NeroErrorCode =
  | "invalid_rule"
  | "invalid_rule_set"
  | "invalid_fact"
  | "source_failed"
  | "secret_detected"
  | "narration_rejected";

export class NeroError extends Error {
  readonly code: NeroErrorCode;
  readonly details: readonly string[];

  constructor(code: NeroErrorCode, message: string, details: readonly string[] = []) {
    super(message);
    this.name = "NeroError";
    this.code = code;
    this.details = details;
  }
}
