import { describe, expect, it } from "vitest";
import {
  applyEvent,
  INITIAL_TRANSCRIPT,
  type TranscriptState,
  transcriptReducer,
} from "./transcript-state.js";

const run = (...actions: Parameters<typeof transcriptReducer>[1][]): TranscriptState =>
  actions.reduce(transcriptReducer, INITIAL_TRANSCRIPT);

describe("transcriptReducer", () => {
  it("adds the user message and marks the session busy", () => {
    const state = run({ type: "user", text: "hello" });
    expect(state.items).toEqual([{ id: 1, kind: "user", text: "hello" }]);
    expect(state.busy).toBe(true);
  });

  it("streams text deltas into one pending assistant message", () => {
    const state = run(
      { type: "event", event: { type: "text_delta", text: "Hel" } },
      { type: "event", event: { type: "text_delta", text: "lo" } },
    );
    expect(state.pending).toEqual([{ kind: "assistant", text: "Hello" }]);
  });

  it("tracks tool status from start to finish", () => {
    const state = run(
      {
        type: "event",
        event: { type: "tool_started", callId: "c1", tool: "check", label: "Checking token" },
      },
      { type: "event", event: { type: "tool_finished", callId: "c1", ok: true, summary: "6/6 sources" } },
    );
    expect(state.pending).toEqual([
      { kind: "tool", callId: "c1", label: "Checking token", status: "ok", summary: "6/6 sources" },
    ]);
  });

  it("moves pending parts into history in order on done", () => {
    const state = run(
      { type: "user", text: "check" },
      { type: "event", event: { type: "tool_started", callId: "c1", tool: "check", label: "Checking" } },
      { type: "event", event: { type: "text_delta", text: "Result" } },
      { type: "event", event: { type: "error", code: "x", message: "One source failed" } },
      { type: "event", event: { type: "done" } },
    );
    expect(state.pending).toEqual([]);
    expect(state.busy).toBe(false);
    expect(state.items.map((item) => item.kind)).toEqual(["user", "tool", "assistant", "notice"]);
    expect(state.items.map((item) => item.id)).toEqual([1, 2, 3, 4]);
  });

  it("marks tools still running at done as interrupted", () => {
    const state = run(
      { type: "event", event: { type: "tool_started", callId: "c1", tool: "check", label: "Checking" } },
      { type: "event", event: { type: "done" } },
    );
    expect(state.items[0]).toMatchObject({ kind: "tool", status: "failed", summary: "interrupted" });
  });

  it("clears history but keeps ids increasing", () => {
    const state = run({ type: "notice", level: "info", lines: ["a"] }, { type: "clear" });
    expect(state.items).toEqual([]);
    expect(transcriptReducer(state, { type: "notice", level: "info", lines: ["b"] }).items[0]?.id).toBe(2);
  });

  it("keeps risk cards and portfolio snapshots as parts", () => {
    const state = applyEvent(INITIAL_TRANSCRIPT, {
      type: "portfolio",
      snapshot: { lines: [], totalUsd: 0, updatedAt: "2026-11-11T00:00:00.000Z" },
    });
    expect(state.pending[0]?.kind).toBe("portfolio");
  });
});
