import { describe, expect, it } from "vitest";
import { OBSERVED_AT } from "../test-support/builders.js";
import { parseFact } from "./fact.js";
import { FACT_CATALOG, FACT_KEYS, worseValue } from "./fact-catalog.js";

const validFact = {
  subject: { kind: "token", chain: "base", address: "0xabc" },
  key: "token.sell_tax",
  value: 0.12,
  source: "goplus",
  observedAt: OBSERVED_AT,
  sourceUrl: "https://gopluslabs.io/token-security/8453/0xabc",
};

describe("parseFact", () => {
  it("accepts a valid fact", () => {
    const result = parseFact(validFact);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.value).toBe(0.12);
  });

  it("rejects unknown fact keys", () => {
    const result = parseFact({ ...validFact, key: "token.is_rugpull" });
    expect(result).toEqual({ ok: false, error: ['key: unknown fact key "token.is_rugpull"'] });
  });

  it.each([
    ["ratio above 1", "token.sell_tax", 1.5],
    ["negative usd", "token.liquidity_usd", -1],
    ["boolean as string", "token.is_honeypot", "true"],
    ["tags as string", "address.malicious_tags", "phishing"],
    ["NaN liquidity", "token.liquidity_usd", Number.NaN],
  ])("rejects %s", (_name, key, value) => {
    expect(parseFact({ ...validFact, key, value }).ok).toBe(false);
  });

  it.each([
    ["non-https source url", { sourceUrl: "http://example.com" }],
    ["bad timestamp", { observedAt: "yesterday" }],
    ["bad source id", { source: "GoPlus Labs" }],
    ["unknown chain", { subject: { kind: "token", chain: "polygon", address: "0xabc" } }],
  ])("rejects %s", (_name, patch) => {
    expect(parseFact({ ...validFact, ...patch }).ok).toBe(false);
  });
});

describe("fact catalog", () => {
  it("has a description for every key", () => {
    for (const key of FACT_KEYS) expect(FACT_CATALOG[key].description.length).toBeGreaterThan(0);
  });

  it.each([
    ["token.is_honeypot", false, true, true],
    ["token.is_open_source", true, false, false],
    ["token.sell_tax", 0.05, 0.3, 0.3],
    ["token.liquidity_usd", 50_000, 900, 900],
    ["token.lp_locked_share", 0.9, 0.1, 0.1],
  ] as const)("worseValue(%s, %s, %s) is %s", (key, a, b, expected) => {
    expect(worseValue(key, a as never, b as never)).toBe(expected);
    expect(worseValue(key, b as never, a as never)).toBe(expected);
  });

  it("unions malicious tags", () => {
    expect(worseValue("address.malicious_tags", ["phishing"], ["drainer", "phishing"])).toEqual([
      "drainer",
      "phishing",
    ]);
  });
});
