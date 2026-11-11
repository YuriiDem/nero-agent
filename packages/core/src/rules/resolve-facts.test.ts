import { describe, expect, it } from "vitest";
import { factOf, subjectOf } from "../test-support/builders.js";
import { resolveFacts } from "./resolve-facts.js";

describe("resolveFacts", () => {
  it("keeps the worse value and every fact when sources disagree", () => {
    const low = factOf("token.sell_tax", 0.02, "goplus");
    const high = factOf("token.sell_tax", 0.4, "dexscreener");
    const resolved = resolveFacts(subjectOf(), [low, high]).get("token.sell_tax");
    expect(resolved?.value).toBe(0.4);
    expect(resolved?.evidence).toEqual([low, high]);
  });

  it("treats a single honeypot=true report as the resolved value", () => {
    const resolved = resolveFacts(subjectOf(), [
      factOf("token.is_honeypot", false, "goplus"),
      factOf("token.is_honeypot", true, "rugcheck"),
    ]).get("token.is_honeypot");
    expect(resolved?.value).toBe(true);
  });

  it("ignores facts about other subjects", () => {
    const other = subjectOf("token", "ethereum", "0xother");
    const resolved = resolveFacts(subjectOf(), [factOf("token.is_honeypot", true, "goplus", other)]);
    expect(resolved.size).toBe(0);
  });
});
