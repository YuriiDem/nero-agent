import { describe, expect, it } from "vitest";
import { PROVIDERS_PACKAGE } from "./index.js";

describe("providers", () => {
  it("exposes its package name", () => {
    expect(PROVIDERS_PACKAGE).toBe("@nero-agent/providers");
  });
});
