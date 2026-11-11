import type { SourceId } from "./fact.js";
import type { FactKey } from "./fact-catalog.js";

export type SourceFailure = {
  readonly source: SourceId;
  readonly reason: string;
};

export type Coverage = {
  readonly required: readonly FactKey[];
  readonly obtained: readonly FactKey[];
  readonly missing: readonly FactKey[];
  readonly failed: readonly SourceFailure[];
  readonly unevaluatedRules: readonly string[];
  readonly sources: {
    readonly attempted: readonly SourceId[];
    readonly succeeded: readonly SourceId[];
  };
};
