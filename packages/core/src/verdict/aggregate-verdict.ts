import type { Rule } from "../rules/rule-schema.js";
import type { Coverage } from "../shared/coverage.js";
import { type Finding, SEVERITY_RANK, type Severity } from "../shared/finding.js";
import type { VerdictLevel } from "../shared/verdict.js";

export type LevelInput = {
  readonly applicable: readonly Rule[];
  readonly findings: readonly Finding[];
  readonly unevaluated: readonly Rule[];
  readonly coverage: Coverage;
};

export type LevelResult = {
  readonly level: VerdictLevel;
  readonly complete: boolean;
};

const BLOCKING_SEVERITIES: readonly Severity[] = ["critical", "high"];

export const aggregateLevel = ({ applicable, findings, unevaluated, coverage }: LevelInput): LevelResult => {
  const complete = applicable.length > 0 && unevaluated.length === 0 && coverage.failed.length === 0;
  const worst = worstSeverity(findings);

  if (worst !== undefined && worst !== "info") return { level: worst, complete };

  const nothingChecked = applicable.length === 0 || coverage.sources.succeeded.length === 0;
  const blockingGap = unevaluated.some((rule) => BLOCKING_SEVERITIES.includes(rule.severity));
  return { level: nothingChecked || blockingGap ? "insufficient_data" : "no_known_risks", complete };
};

const worstSeverity = (findings: readonly Finding[]): Severity | undefined =>
  findings.reduce<Severity | undefined>(
    (worst, finding) =>
      worst === undefined || SEVERITY_RANK[finding.severity] > SEVERITY_RANK[worst]
        ? finding.severity
        : worst,
    undefined,
  );
