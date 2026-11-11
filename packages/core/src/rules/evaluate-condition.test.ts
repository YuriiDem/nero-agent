import { describe, expect, it } from "vitest";
import { factOf, ruleSetOf, subjectOf } from "../test-support/builders.js";
import { allOf, anyOf, evaluateCondition, negate, type Truth } from "./evaluate-condition.js";
import { resolveFacts } from "./resolve-facts.js";

const T: Truth = "true";
const F: Truth = "false";
const U: Truth = "unknown";

describe("Kleene logic", () => {
  it.each([
    [[T, T], T],
    [[T, F], F],
    [[T, U], U],
    [[F, U], F],
    [[U, U], U],
  ] as const)("allOf(%j) = %s", (values, expected) => {
    expect(allOf(values)).toBe(expected);
  });

  it.each([
    [[F, F], F],
    [[T, F], T],
    [[F, U], U],
    [[T, U], T],
    [[U, U], U],
  ] as const)("anyOf(%j) = %s", (values, expected) => {
    expect(anyOf(values)).toBe(expected);
  });

  it("negates true/false and keeps unknown", () => {
    expect([negate(T), negate(F), negate(U)]).toEqual([F, T, U]);
  });
});

const evaluate = (when: unknown, facts: Parameters<typeof resolveFacts>[1]): Truth => {
  const [rule] = ruleSetOf([
    { id: "t.rule", title: "t", severity: "high", appliesTo: { kind: "token" }, when, explain: "t" },
  ]).rules;
  if (rule === undefined) throw new Error("rule missing");
  return evaluateCondition(rule.when, resolveFacts(subjectOf(), facts));
};

describe("operators", () => {
  const tax = [factOf("token.sell_tax", 0.2)];

  it.each([
    [{ fact: "token.sell_tax", eq: 0.2 }, T],
    [{ fact: "token.sell_tax", neq: 0.2 }, F],
    [{ fact: "token.sell_tax", gt: 0.1 }, T],
    [{ fact: "token.sell_tax", gte: 0.2 }, T],
    [{ fact: "token.sell_tax", lt: 0.2 }, F],
    [{ fact: "token.sell_tax", lte: 0.2 }, T],
    [{ fact: "token.sell_tax", in: [0.1, 0.2] }, T],
    [{ fact: "token.sell_tax", exists: true }, T],
  ])("%j on sell_tax=0.2 is %s", (when, expected) => {
    expect(evaluate(when, tax)).toBe(expected);
  });

  it("booleans compare with eq", () => {
    expect(evaluate({ fact: "token.is_honeypot", eq: true }, [factOf("token.is_honeypot", true)])).toBe(T);
    expect(evaluate({ fact: "token.is_honeypot", eq: true }, [factOf("token.is_honeypot", false)])).toBe(F);
  });

  it("tags support contains and in (any-of)", () => {
    const tags = [factOf("address.malicious_tags", ["phishing", "drainer"], "goplus", subjectOf("token"))];
    expect(evaluate({ fact: "address.malicious_tags", contains: "drainer" }, tags)).toBe(T);
    expect(evaluate({ fact: "address.malicious_tags", in: ["mixer", "phishing"] }, tags)).toBe(T);
    expect(evaluate({ fact: "address.malicious_tags", in: ["mixer"] }, tags)).toBe(F);
  });

  it("missing facts are unknown, never false", () => {
    expect(evaluate({ fact: "token.is_honeypot", eq: true }, [])).toBe(U);
    expect(evaluate({ fact: "token.is_honeypot", neq: true }, [])).toBe(U);
    expect(evaluate({ not: { fact: "token.is_honeypot", eq: true } }, [])).toBe(U);
  });

  it("exists is decidable without the fact", () => {
    expect(evaluate({ fact: "token.is_honeypot", exists: true }, [])).toBe(F);
  });

  it("any fires on one true operand even when others are unknown", () => {
    const when = {
      any: [
        { fact: "token.is_honeypot", eq: true },
        { fact: "token.sell_tax", gt: 0.1 },
      ],
    };
    expect(evaluate(when, tax)).toBe(T);
  });
});
