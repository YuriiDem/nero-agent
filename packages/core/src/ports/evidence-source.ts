import type { SourceFailure } from "../shared/coverage.js";
import type { Fact, SourceId } from "../shared/fact.js";
import type { Result } from "../shared/result.js";
import type { Subject } from "../shared/subject.js";

export type CollectOptions = {
  readonly signal: AbortSignal;
};

export type EvidenceSource = {
  readonly id: SourceId;
  supports(subject: Subject): boolean;
  collect(subject: Subject, options: CollectOptions): Promise<Result<readonly Fact[], SourceFailure>>;
};
