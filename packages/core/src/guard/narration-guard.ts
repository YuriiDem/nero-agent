import { z } from "zod";
import type { Severity } from "../shared/finding.js";
import { err, ok, type Result } from "../shared/result.js";
import type { Verdict } from "../shared/verdict.js";

export type Narration = {
  readonly summary: string;
  readonly findingIds: readonly string[];
};

export type GuardViolationCode =
  | "invalid_shape"
  | "unknown_finding"
  | "missing_finding"
  | "safety_claim"
  | "advice_or_prediction";

export type GuardViolation = {
  readonly code: GuardViolationCode;
  readonly detail: string;
};

export const MAX_SUMMARY_LENGTH = 1200;
const MUST_CITE: readonly Severity[] = ["critical", "high"];

const narrationSchema = z
  .object({
    summary: z.string().trim().min(1).max(MAX_SUMMARY_LENGTH),
    findingIds: z.array(z.string().max(120)).max(64),
  })
  .strict();

const SAFETY_CLAIMS: readonly RegExp[] = [
  /\bsafe(ly)?\b/i,
  /\bsecure\b/i,
  /\blegit(imate)?\b/i,
  /\btrust(worthy|ed)\b/i,
  /\bno risks?\b/i,
  /\brisk[- ]?free\b/i,
  /\bguarantee[sd]?\b/i,
  /\b100\s?%/i,
  /\bnot a scam\b/i,
  /\bcan(?:no|['’])t be a scam\b/i,
  /\bscam[- ]?free\b/i,
];

const ADVICE_OR_PREDICTION: readonly RegExp[] = [
  /\byou should (buy|sell|invest|hold|ape)\b/i,
  /\b(i|we) (recommend|suggest) (buying|selling|investing|holding)\b/i,
  /\b(buy|sell) (it |this )?(now|today|soon)\b/i,
  /\bgood (investment|buy|entry|opportunity)\b/i,
  /\binvest(ing)? in\b/i,
  /\bprice (will|is going to|could|should|might) (rise|go up|pump|increase|drop|fall|dump|recover)\b/i,
  /\b(to the )?moon(ing|shot)?\b/i,
  /\b\d+x (gains?|returns?|potential)\b/i,
];

export const checkNarration = (
  raw: unknown,
  verdict: Verdict,
): Result<Narration, readonly GuardViolation[]> => {
  const parsed = narrationSchema.safeParse(raw);
  if (!parsed.success) {
    return err(parsed.error.issues.map((issue) => ({ code: "invalid_shape", detail: issue.message })));
  }

  const narration: Narration = {
    summary: parsed.data.summary,
    findingIds: [...new Set(parsed.data.findingIds)],
  };
  const violations: GuardViolation[] = [];
  const knownIds = new Set(verdict.findings.map((finding) => finding.ruleId));
  const cited = new Set(narration.findingIds);

  for (const id of narration.findingIds) {
    if (!knownIds.has(id)) violations.push({ code: "unknown_finding", detail: id });
  }
  for (const finding of verdict.findings) {
    if (MUST_CITE.includes(finding.severity) && !cited.has(finding.ruleId)) {
      violations.push({ code: "missing_finding", detail: finding.ruleId });
    }
  }
  for (const pattern of SAFETY_CLAIMS) {
    const match = pattern.exec(narration.summary);
    if (match) violations.push({ code: "safety_claim", detail: match[0] });
  }
  for (const pattern of ADVICE_OR_PREDICTION) {
    const match = pattern.exec(narration.summary);
    if (match) violations.push({ code: "advice_or_prediction", detail: match[0] });
  }

  return violations.length > 0 ? err(violations) : ok(narration);
};
