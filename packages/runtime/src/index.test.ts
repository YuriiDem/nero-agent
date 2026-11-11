import { describe, expect, it } from "vitest";
import { wiredPackages } from "./index.js";

describe("runtime", () => {
  it("wires core and providers", () => {
    expect(wiredPackages()).toEqual(["@nero-agent/core", "@nero-agent/providers", "@nero-agent/runtime"]);
  });
});
