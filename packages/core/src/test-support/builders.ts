import type { Rule } from "../rules/rule-schema.js";
import { loadRuleSet, type RuleSet } from "../rules/rule-set.js";
import { unsafeAddress } from "../shared/address.js";
import type { Chain } from "../shared/chain.js";
import type { Fact, SourceId } from "../shared/fact.js";
import type { FactKey, FactValue } from "../shared/fact-catalog.js";
import type { Finding } from "../shared/finding.js";
import type { Subject, SubjectKind } from "../shared/subject.js";
import type { Verdict } from "../shared/verdict.js";

export const OBSERVED_AT = "2026-11-11T12:00:00.000Z";

export const subjectOf = (
  kind: SubjectKind = "token",
  chain: Chain = "ethereum",
  address = "0xtoken",
): Subject => ({
  kind,
  chain,
  address: unsafeAddress(address),
});

export const factOf = <K extends FactKey>(
  key: K,
  value: FactValue<K>,
  source: SourceId = "goplus",
  subject: Subject = subjectOf(),
): Fact => ({ subject, key, value, source, observedAt: OBSERVED_AT }) as Fact;

export const ruleSetOf = (rules: readonly unknown[], version = "1.0.0"): RuleSet => {
  const result = loadRuleSet({ version, rules });
  if (!result.ok) throw new Error(`invalid test rules: ${result.error.join("; ")}`);
  return result.value;
};

export const findingOf = (ruleId: string, severity: Rule["severity"]): Finding => ({
  ruleId,
  severity,
  title: ruleId,
  explain: ruleId,
  evidence: [],
});

export const verdictWith = (findings: readonly Finding[]): Verdict => ({
  subject: subjectOf(),
  level: "medium",
  complete: true,
  findings,
  coverage: {
    required: [],
    obtained: [],
    missing: [],
    failed: [],
    unevaluatedRules: [],
    sources: { attempted: ["goplus"], succeeded: ["goplus"] },
  },
  rulesVersion: "1.0.0",
});

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export const encodeBase58 = (bytes: Uint8Array): string => {
  const digits: number[] = [];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      carry += (digits[i] ?? 0) << 8;
      digits[i] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let leadingZeros = "";
  for (const byte of bytes) {
    if (byte !== 0) break;
    leadingZeros += "1";
  }
  return (
    leadingZeros +
    digits
      .reverse()
      .map((digit) => BASE58_ALPHABET[digit])
      .join("")
  );
};
