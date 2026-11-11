import type { NeroEvent } from "@nero-agent/core";
import { describe, expect, it } from "vitest";
import { createNeroSession, NO_MODEL_REPLY } from "./create-session.js";

const collect = async (events: AsyncIterable<NeroEvent>): Promise<NeroEvent[]> => {
  const result: NeroEvent[] = [];
  for await (const event of events) result.push(event);
  return result;
};

const signal = new AbortController().signal;
const TEST_MNEMONIC = `${"abandon ".repeat(11)}about`;

describe("createNeroSession", () => {
  it("screens secrets before anything is sent", () => {
    const session = createNeroSession();
    expect(session.screenInput(TEST_MNEMONIC)).toEqual({ blocked: true, kinds: ["seed_phrase"] });
    expect(session.screenInput("check 0x6b175474e89094c44da98b954eedeac495271d0f").blocked).toBe(false);
  });

  it("replies with the no-model stub through the event stream", async () => {
    const events = await collect(createNeroSession().send("hello", { signal }));
    expect(events).toEqual([{ type: "text_delta", text: NO_MODEL_REPLY }, { type: "done" }]);
  });

  it("refuses to forward a secret even if the UI forgot to screen it", async () => {
    const events = await collect(createNeroSession().send(TEST_MNEMONIC, { signal }));
    expect(events[0]).toMatchObject({ type: "error", code: "secret_detected" });
    expect(JSON.stringify(events)).not.toContain("abandon");
  });

  it("stops when the request is already cancelled", async () => {
    const controller = new AbortController();
    controller.abort();
    expect(await collect(createNeroSession().send("hello", { signal: controller.signal }))).toEqual([
      { type: "done" },
    ]);
  });

  it("reports no model and no sources yet", () => {
    expect(createNeroSession().status()).toEqual({ model: null, sources: [] });
  });
});
