import { describe, expect, it } from "vitest";
import { describeBuild } from "./index.js";

describe("cli", () => {
  it("reaches core through runtime", () => {
    expect(describeBuild()).toContain("@nero-agent/core");
  });
});
