import type { Coverage } from "./coverage.js";
import type { Finding } from "./finding.js";
import type { Subject } from "./subject.js";

export const VERDICT_LEVELS = ["critical", "high", "medium", "no_known_risks", "insufficient_data"] as const;
export type VerdictLevel = (typeof VERDICT_LEVELS)[number];

export type Verdict = {
  readonly subject: Subject;
  readonly level: VerdictLevel;
  readonly complete: boolean;
  readonly findings: readonly Finding[];
  readonly coverage: Coverage;
  readonly rulesVersion: string;
};
