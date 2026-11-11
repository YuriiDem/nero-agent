import { describe, expect, it } from "vitest";
import { loadRuleSet } from "./rule-set.js";

const baseRule = {
  id: "evm.token.honeypot",
  title: "Token cannot be sold",
  severity: "critical",
  appliesTo: { kind: "token", chains: ["evm"] },
  when: { all: [{ fact: "token.is_honeypot", eq: true }] },
  explain: "Simulated sells fail.",
};

const errorsFor = (rules: readonly unknown[], version: unknown = "1.0.0"): readonly string[] => {
  const result = loadRuleSet({ version, rules });
  return result.ok ? [] : result.error;
};

describe("loadRuleSet", () => {
  it("loads valid rules and freezes them", () => {
    const result = loadRuleSet({ version: "1.2.0", rules: [baseRule] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.version).toBe("1.2.0");
    expect(result.value.rules[0]?.when).toEqual({
      all: [{ fact: "token.is_honeypot", op: "eq", operand: true }],
    });
    expect(Object.isFrozen(result.value.rules)).toBe(true);
  });

  it("rejects a non-semver version", () => {
    expect(errorsFor([baseRule], "latest")).toEqual(["version: must be semver like 1.0.0"]);
  });

  it("rejects duplicate ids", () => {
    expect(errorsFor([baseRule, baseRule])).toEqual(["rules[1] (evm.token.honeypot): duplicate rule id"]);
  });

  it("rejects unknown fact keys", () => {
    const errors = errorsFor([{ ...baseRule, when: { fact: "token.is_rug", eq: true } }]);
    expect(errors).toEqual(['evm.token.honeypot.when: unknown fact key "token.is_rug"']);
  });

  it.each([
    [
      "gt on a boolean",
      { fact: "token.is_honeypot", gt: 1 },
      'operator "gt" is not allowed for boolean facts',
    ],
    ["contains on a ratio", { fact: "token.sell_tax", contains: "x" }, 'operator "contains"'],
    ["string operand for a ratio", { fact: "token.sell_tax", eq: "high" }, "must be a number in 0..1"],
    ["ratio operand above 1", { fact: "token.sell_tax", gt: 10 }, "must be a number in 0..1"],
    ["two operators", { fact: "token.sell_tax", gt: 0.1, lt: 0.5 }, "expected exactly one operator, got 2"],
    ["no operator", { fact: "token.sell_tax" }, "expected exactly one operator, got 0"],
  ])("rejects %s", (_name, when, message) => {
    const errors = errorsFor([{ ...baseRule, when }]);
    expect(errors.join("\n")).toContain(message);
  });

  it.each([
    ["unknown operator", { fact: "token.sell_tax", matches: ".*" }],
    ["unknown severity", { severity: "low" }],
    ["extra top-level field", { script: "process.exit()" }],
    ["bad id", { id: "Honeypot Rule" }],
    ["unknown chain", { appliesTo: { kind: "token", chains: ["polygon"] } }],
  ])("rejects %s at schema level", (_name, patch) => {
    const rule = "fact" in patch ? { ...baseRule, when: patch } : { ...baseRule, ...patch };
    expect(errorsFor([rule]).length).toBeGreaterThan(0);
  });

  it("rejects nesting deeper than the limit", () => {
    let when: unknown = { fact: "token.is_honeypot", eq: true };
    for (let i = 0; i < 10; i++) when = { not: when };
    expect(errorsFor([{ ...baseRule, when }]).join()).toContain("nesting deeper than 8");
  });

  it("reports errors for every bad rule, not only the first", () => {
    const errors = errorsFor([
      { ...baseRule, id: "a.one", when: { fact: "nope", eq: true } },
      { ...baseRule, id: "a.two", when: { fact: "nope", eq: true } },
    ]);
    expect(errors).toHaveLength(2);
  });
});
