export const CORE_PACKAGE = "@nero-agent/core";

export type { NeroEvent, NeroEventType, PortfolioLine, PortfolioSnapshot } from "./agent/events.js";
export {
  checkNarration,
  type GuardViolation,
  type GuardViolationCode,
  MAX_SUMMARY_LENGTH,
  type Narration,
} from "./guard/narration-guard.js";
export { type SanitizeOptions, sanitizeUntrusted, TRUNCATION_MARKER } from "./guard/sanitize-untrusted.js";
export { detectSecrets, SECRET_KINDS, type SecretKind, type SecretScan } from "./guard/secret-detector.js";
export { UNTRUSTED_TAG, wrapUntrusted } from "./guard/untrusted-block.js";
export * from "./ports/index.js";
export {
  allOf,
  anyOf,
  evaluateCondition,
  negate,
  referencedFacts,
  type Truth,
} from "./rules/evaluate-condition.js";
export { evaluateRules, type RuleEvaluation, ruleApplies } from "./rules/evaluate-rules.js";
export { type ResolvedFact, type ResolvedFacts, resolveFacts } from "./rules/resolve-facts.js";
export {
  type Condition,
  type LeafCondition,
  OPERATORS,
  type Operator,
  type Rule,
  type Scalar,
} from "./rules/rule-schema.js";
export { loadRuleSet, type RuleSet, type RuleSetInput } from "./rules/rule-set.js";
export * from "./shared/index.js";
export { aggregateLevel, type LevelInput, type LevelResult } from "./verdict/aggregate-verdict.js";
export { buildCoverage, type CoverageInput } from "./verdict/build-coverage.js";
export { type CheckSubjectInput, checkSubject } from "./verdict/check-subject.js";
