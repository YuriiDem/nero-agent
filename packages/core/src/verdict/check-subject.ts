import { evaluateRules } from "../rules/evaluate-rules.js";
import type { RuleSet } from "../rules/rule-set.js";
import type { SourceFailure } from "../shared/coverage.js";
import type { Fact, SourceId } from "../shared/fact.js";
import { SEVERITY_RANK } from "../shared/finding.js";
import type { Subject } from "../shared/subject.js";
import type { Verdict } from "../shared/verdict.js";
import { aggregateLevel } from "./aggregate-verdict.js";
import { buildCoverage } from "./build-coverage.js";

export type CheckSubjectInput = {
  readonly subject: Subject;
  readonly facts: readonly Fact[];
  readonly attemptedSources: readonly SourceId[];
  readonly failures: readonly SourceFailure[];
  readonly ruleSet: RuleSet;
};

export const checkSubject = (input: CheckSubjectInput): Verdict => {
  const evaluation = evaluateRules(input.subject, input.facts, input.ruleSet);
  const coverage = buildCoverage({ ...input, evaluation });
  const findings = [...evaluation.findings].sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || a.ruleId.localeCompare(b.ruleId),
  );
  const { level, complete } = aggregateLevel({
    applicable: evaluation.applicable,
    findings,
    unevaluated: evaluation.unevaluated,
    coverage,
  });

  return {
    subject: input.subject,
    level,
    complete,
    findings,
    coverage,
    rulesVersion: input.ruleSet.version,
  };
};
