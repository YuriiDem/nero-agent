import { referencedFacts } from "../rules/evaluate-condition.js";
import type { RuleEvaluation } from "../rules/evaluate-rules.js";
import type { Coverage, SourceFailure } from "../shared/coverage.js";
import type { Fact, SourceId } from "../shared/fact.js";
import type { FactKey } from "../shared/fact-catalog.js";
import { type Subject, sameSubject } from "../shared/subject.js";

export type CoverageInput = {
  readonly subject: Subject;
  readonly evaluation: RuleEvaluation;
  readonly facts: readonly Fact[];
  readonly attemptedSources: readonly SourceId[];
  readonly failures: readonly SourceFailure[];
};

export const buildCoverage = ({
  subject,
  evaluation,
  facts,
  attemptedSources,
  failures,
}: CoverageInput): Coverage => {
  const required = unique(evaluation.applicable.flatMap((rule) => referencedFacts(rule.when)));
  const present = new Set(facts.filter((fact) => sameSubject(fact.subject, subject)).map((fact) => fact.key));
  const obtained = required.filter((key) => present.has(key));
  const failedSources = new Set(failures.map((failure) => failure.source));

  return {
    required,
    obtained,
    missing: required.filter((key) => !present.has(key)),
    failed: failures,
    unevaluatedRules: evaluation.unevaluated.map((rule) => rule.id),
    sources: {
      attempted: unique(attemptedSources),
      succeeded: unique(attemptedSources).filter((source) => !failedSources.has(source)),
    },
  };
};

const unique = <T extends FactKey | SourceId>(values: readonly T[]): T[] => [...new Set(values)].sort();
