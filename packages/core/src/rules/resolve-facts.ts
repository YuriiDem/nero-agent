import type { Fact } from "../shared/fact.js";
import { type FactKey, type FactValue, worseValue } from "../shared/fact-catalog.js";
import { type Subject, sameSubject } from "../shared/subject.js";

export type ResolvedFact<K extends FactKey = FactKey> = {
  readonly key: K;
  readonly value: FactValue<K>;
  readonly evidence: readonly Fact[];
};

export type ResolvedFacts = ReadonlyMap<FactKey, ResolvedFact>;

export const resolveFacts = (subject: Subject, facts: readonly Fact[]): ResolvedFacts => {
  const resolved = new Map<FactKey, ResolvedFact>();
  for (const fact of facts) {
    if (!sameSubject(fact.subject, subject)) continue;
    const current = resolved.get(fact.key);
    if (current === undefined) {
      resolved.set(fact.key, { key: fact.key, value: fact.value, evidence: [fact] });
      continue;
    }
    resolved.set(fact.key, {
      key: fact.key,
      value: worseValue(fact.key, current.value, fact.value),
      evidence: [...current.evidence, fact],
    });
  }
  return resolved;
};
