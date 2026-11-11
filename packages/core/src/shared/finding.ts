import type { Fact } from "./fact.js";

export const SEVERITIES = ["critical", "high", "medium", "info"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const SEVERITY_RANK: Readonly<Record<Severity, number>> = { critical: 3, high: 2, medium: 1, info: 0 };

export type Finding = {
  readonly ruleId: string;
  readonly severity: Severity;
  readonly title: string;
  readonly explain: string;
  readonly evidence: readonly Fact[];
};
