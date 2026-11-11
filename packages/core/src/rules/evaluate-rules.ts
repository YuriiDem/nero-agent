import { chainFamily } from "../shared/chain.js";
import type { Fact } from "../shared/fact.js";
import type { Finding } from "../shared/finding.js";
import type { Subject } from "../shared/subject.js";
import { evaluateCondition, referencedFacts } from "./evaluate-condition.js";
import { type ResolvedFacts, resolveFacts } from "./resolve-facts.js";
import type { Rule } from "./rule-schema.js";
import type { RuleSet } from "./rule-set.js";

export type RuleEvaluation = {
  readonly applicable: readonly Rule[];
  readonly findings: readonly Finding[];
  readonly unevaluated: readonly Rule[];
};

export const ruleApplies = (rule: Rule, subject: Subject): boolean => {
  if (rule.appliesTo.kind !== subject.kind) return false;
  const { chains } = rule.appliesTo;
  if (chains === undefined) return true;
  return chains.includes(subject.chain) || chains.includes(chainFamily(subject.chain));
};

export const evaluateRules = (subject: Subject, facts: readonly Fact[], ruleSet: RuleSet): RuleEvaluation => {
  const resolved = resolveFacts(subject, facts);
  const applicable = ruleSet.rules.filter((rule) => ruleApplies(rule, subject));
  const findings: Finding[] = [];
  const unevaluated: Rule[] = [];

  for (const rule of applicable) {
    const truth = evaluateCondition(rule.when, resolved);
    if (truth === "true") findings.push(toFinding(rule, resolved));
    else if (truth === "unknown") unevaluated.push(rule);
  }

  return { applicable, findings, unevaluated };
};

const toFinding = (rule: Rule, resolved: ResolvedFacts): Finding => {
  const keys = [...new Set(referencedFacts(rule.when))];
  return {
    ruleId: rule.id,
    severity: rule.severity,
    title: rule.title,
    explain: rule.explain,
    evidence: keys.flatMap((key) => resolved.get(key)?.evidence ?? []),
  };
};
