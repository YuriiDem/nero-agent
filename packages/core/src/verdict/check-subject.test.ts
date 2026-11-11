import { describe, expect, it } from "vitest";
import type { Fact } from "../shared/fact.js";
import { factOf, ruleSetOf, subjectOf } from "../test-support/builders.js";
import { checkSubject } from "./check-subject.js";

const ruleSet = ruleSetOf([
  {
    id: "evm.token.honeypot",
    title: "Token cannot be sold",
    severity: "critical",
    appliesTo: { kind: "token", chains: ["evm"] },
    when: { fact: "token.is_honeypot", eq: true },
    explain: "Sells fail.",
  },
  {
    id: "token.high_sell_tax",
    title: "High sell tax",
    severity: "high",
    appliesTo: { kind: "token" },
    when: { fact: "token.sell_tax", gte: 0.1 },
    explain: "Sells lose a large share.",
  },
  {
    id: "token.low_liquidity",
    title: "Low liquidity",
    severity: "medium",
    appliesTo: { kind: "token" },
    when: { fact: "token.liquidity_usd", lt: 10_000 },
    explain: "Thin markets.",
  },
  {
    id: "solana.token.freeze_authority",
    title: "Freeze authority active",
    severity: "high",
    appliesTo: { kind: "token", chains: ["solana"] },
    when: { fact: "token.freeze_authority_active", eq: true },
    explain: "Balances can be frozen.",
  },
  {
    id: "token.closed_source",
    title: "Unverified source",
    severity: "info",
    appliesTo: { kind: "token" },
    when: { fact: "token.is_open_source", eq: false },
    explain: "Source not verified.",
  },
]);

const clean: Fact[] = [
  factOf("token.is_honeypot", false),
  factOf("token.sell_tax", 0.01),
  factOf("token.liquidity_usd", 250_000),
  factOf("token.is_open_source", true),
];

const check = (facts: readonly Fact[], failures: { source: string; reason: string }[] = []) =>
  checkSubject({
    subject: subjectOf(),
    facts,
    attemptedSources: ["goplus", "dexscreener"],
    failures,
    ruleSet,
  });

const replace = (key: Fact["key"], fact: Fact): Fact[] => [...clean.filter((f) => f.key !== key), fact];

describe("checkSubject", () => {
  it("all facts present and nothing fires: no_known_risks, complete", () => {
    const verdict = check(clean);
    expect(verdict).toMatchObject({
      level: "no_known_risks",
      complete: true,
      findings: [],
      rulesVersion: "1.0.0",
    });
    expect(verdict.coverage.missing).toEqual([]);
  });

  it("only rules for the subject's chain apply", () => {
    expect(check(clean).coverage.required).not.toContain("token.freeze_authority_active");
  });

  it("level is the worst finding, sorted by severity", () => {
    const verdict = check([
      ...replace("token.is_honeypot", factOf("token.is_honeypot", true)).filter(
        (f) => f.key !== "token.sell_tax",
      ),
      factOf("token.sell_tax", 0.3),
    ]);
    expect(verdict.level).toBe("critical");
    expect(verdict.findings.map((f) => f.ruleId)).toEqual(["evm.token.honeypot", "token.high_sell_tax"]);
  });

  it("info findings do not raise the level", () => {
    const verdict = check(replace("token.is_open_source", factOf("token.is_open_source", false)));
    expect(verdict.level).toBe("no_known_risks");
    expect(verdict.findings).toHaveLength(1);
  });

  it("missing critical fact without findings: insufficient_data", () => {
    const verdict = check(clean.filter((f) => f.key !== "token.is_honeypot"));
    expect(verdict).toMatchObject({ level: "insufficient_data", complete: false });
    expect(verdict.coverage.missing).toEqual(["token.is_honeypot"]);
    expect(verdict.coverage.unevaluatedRules).toEqual(["evm.token.honeypot"]);
  });

  it("missing critical fact with a finding: worst finding, incomplete", () => {
    const facts = replace("token.sell_tax", factOf("token.sell_tax", 0.5)).filter(
      (f) => f.key !== "token.is_honeypot",
    );
    expect(check(facts)).toMatchObject({ level: "high", complete: false });
  });

  it("only a medium rule unevaluated: no_known_risks but incomplete", () => {
    const verdict = check(clean.filter((f) => f.key !== "token.liquidity_usd"));
    expect(verdict).toMatchObject({ level: "no_known_risks", complete: false });
  });

  it("a failed source makes the verdict incomplete and is reported", () => {
    const verdict = check(clean, [{ source: "dexscreener", reason: "timeout" }]);
    expect(verdict.complete).toBe(false);
    expect(verdict.coverage.sources).toEqual({ attempted: ["dexscreener", "goplus"], succeeded: ["goplus"] });
  });

  it("no facts at all: insufficient_data", () => {
    const verdict = check(
      [],
      [
        { source: "goplus", reason: "rate limited" },
        { source: "dexscreener", reason: "timeout" },
      ],
    );
    expect(verdict.level).toBe("insufficient_data");
  });

  it("no applicable rules: insufficient_data, never no_known_risks", () => {
    const verdict = checkSubject({
      subject: subjectOf("address"),
      facts: [],
      attemptedSources: ["goplus"],
      failures: [],
      ruleSet,
    });
    expect(verdict).toMatchObject({ level: "insufficient_data", complete: false });
  });

  it("findings carry the evidence of every source", () => {
    const verdict = check([
      ...clean.filter((f) => f.key !== "token.is_honeypot"),
      factOf("token.is_honeypot", false, "goplus"),
      factOf("token.is_honeypot", true, "rugcheck"),
    ]);
    expect(verdict.findings[0]?.evidence.map((f) => f.source)).toEqual(["goplus", "rugcheck"]);
  });
});
