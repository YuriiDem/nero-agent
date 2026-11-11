import { describe, expect, it } from "vitest";
import { findingOf, verdictWith } from "../test-support/builders.js";
import { checkNarration, MAX_SUMMARY_LENGTH } from "./narration-guard.js";

const verdict = verdictWith([
  findingOf("evm.token.honeypot", "critical"),
  findingOf("token.high_sell_tax", "high"),
  findingOf("token.low_liquidity", "medium"),
]);

const allCited = ["evm.token.honeypot", "token.high_sell_tax"];

const codesFor = (summary: string, findingIds: readonly string[] = allCited): readonly string[] => {
  const result = checkNarration({ summary, findingIds }, verdict);
  return result.ok ? [] : result.error.map((violation) => violation.code);
};

describe("checkNarration", () => {
  it("accepts a factual narration citing critical and high findings", () => {
    const result = checkNarration(
      {
        summary: "Sells of this token fail in simulation and the sell tax is 30%. Liquidity is also thin.",
        findingIds: [...allCited, "evm.token.honeypot"],
      },
      verdict,
    );
    expect(result).toEqual({
      ok: true,
      value: { summary: expect.any(String), findingIds: allCited },
    });
  });

  it("allows skipping medium findings", () => {
    expect(codesFor("Sells fail and the sell tax is high.")).toEqual([]);
  });

  it.each([
    ["not an object", "just text"],
    ["missing findingIds", { summary: "x" }],
    ["extra fields", { summary: "x", findingIds: [], level: "no_known_risks" }],
    ["empty summary", { summary: "   ", findingIds: [] }],
    ["too long", { summary: "a".repeat(MAX_SUMMARY_LENGTH + 1), findingIds: [] }],
  ])("rejects invalid shape: %s", (_name, raw) => {
    const result = checkNarration(raw, verdict);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error[0]?.code).toBe("invalid_shape");
  });

  it("rejects invented finding ids", () => {
    expect(codesFor("Sells fail.", [...allCited, "token.made_up"])).toEqual(["unknown_finding"]);
  });

  it("rejects narrations that omit a critical or high finding", () => {
    const result = checkNarration(
      { summary: "The sell tax is high.", findingIds: ["token.high_sell_tax"] },
      verdict,
    );
    expect(result).toEqual({
      ok: false,
      error: [{ code: "missing_finding", detail: "evm.token.honeypot" }],
    });
  });

  it.each([
    "This token is safe.",
    "It is not safe to say.",
    "The contract looks legit.",
    "A trustworthy team.",
    "There is no risk here.",
    "Risk-free entry.",
    "I guarantee nothing bad happens.",
    "100% clean.",
    "This is not a scam.",
    "It can't be a scam.",
    "Looks secure overall.",
  ])("rejects safety claim: %s", (summary) => {
    expect(codesFor(summary)).toContain("safety_claim");
  });

  it.each([
    "You should buy before the listing.",
    "I recommend selling.",
    "Buy it now.",
    "A good investment.",
    "Consider investing in it.",
    "The price will go up soon.",
    "This is going to the moon.",
    "Easy 10x gains.",
  ])("rejects advice or prediction: %s", (summary) => {
    expect(codesFor(summary)).toContain("advice_or_prediction");
  });

  it.each([
    "The sell tax is 30% and buys are taxed at 5%.",
    "No known risks were found by the checks that ran, but coverage is partial.",
    "Sells fail in simulation; holders may be unable to exit.",
  ])("does not flag factual risk language: %s", (summary) => {
    expect(codesFor(summary)).toEqual([]);
  });
});
