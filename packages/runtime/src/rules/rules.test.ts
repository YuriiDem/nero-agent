import { fileURLToPath } from "node:url";
import { NeroError } from "@nero-agent/core";
import { describe, expect, it } from "vitest";
import { loadRulesFromDisk } from "./load-rules-from-disk.js";
import { parseYaml } from "./parse-yaml.js";
import { verifyRuleFixtures } from "./verify-rule-fixtures.js";

const dir = (relative: string): string => fileURLToPath(new URL(relative, import.meta.url));

const REPO_RULES = dir("../../../../rules/");
const VALID = dir("./__fixtures__/valid/");
const BROKEN = dir("./__fixtures__/broken/");

describe("repository rules", () => {
  it("every rule in rules/ loads and passes its fixtures", async () => {
    const report = await verifyRuleFixtures(REPO_RULES);
    expect(report.failures).toEqual([]);
    await expect(loadRulesFromDisk(REPO_RULES)).resolves.toMatchObject({ version: expect.any(String) });
  });
});

describe("loadRulesFromDisk", () => {
  it("loads rules with the manifest version", async () => {
    const ruleSet = await loadRulesFromDisk(VALID);
    expect(ruleSet.version).toBe("0.1.0");
    expect(ruleSet.rules.map((rule) => rule.id)).toEqual([
      "common.token.high_sell_tax",
      "evm.token.honeypot",
    ]);
  });

  it("refuses a directory with unreadable or invalid rules", async () => {
    await expect(loadRulesFromDisk(BROKEN)).rejects.toBeInstanceOf(NeroError);
  });
});

describe("verifyRuleFixtures", () => {
  it("passes valid rules with fires/silent/unknown cases", async () => {
    const report = await verifyRuleFixtures(VALID);
    expect(report).toEqual({ checkedRules: 2, checkedCases: 6, failures: [] });
  });

  it("reports missing fixtures, wrong expectations and unsafe YAML", async () => {
    const report = await verifyRuleFixtures(BROKEN);
    expect(report.failures.map((failure) => failure.file)).toEqual([
      "alias-bomb.yaml",
      "no-fixture.yaml",
      "wrong-expectation.yaml",
    ]);
    expect(report.failures[1]?.message).toBe("missing sibling .fixture.yaml");
    expect(report.failures[2]?.message).toBe("claims proxy=false fires: expected fires, got silent");
  });
});

describe("parseYaml", () => {
  it("rejects aliases (entity expansion)", () => {
    expect(() => parseYaml("a: &x [1, 2]\nb: *x\n")).toThrow();
  });

  it("rejects duplicate keys", () => {
    expect(() => parseYaml("id: a\nid: b\n")).toThrow();
  });

  it("does not resolve custom or language tags", () => {
    expect(() => parseYaml("x: !!js/function 'return 1'\n")).toThrow();
  });
});
