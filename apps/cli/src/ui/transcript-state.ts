import type { NeroEvent, PortfolioSnapshot, Verdict } from "@nero-agent/runtime";

export type NoticeLevel = "info" | "warning" | "error";
export type ToolStatus = "running" | "ok" | "failed";

export type TranscriptPart =
  | { readonly kind: "user"; readonly text: string }
  | { readonly kind: "assistant"; readonly text: string }
  | { readonly kind: "notice"; readonly level: NoticeLevel; readonly lines: readonly string[] }
  | {
      readonly kind: "tool";
      readonly callId: string;
      readonly label: string;
      readonly status: ToolStatus;
      readonly summary?: string;
    }
  | { readonly kind: "risk_card"; readonly verdict: Verdict }
  | { readonly kind: "portfolio"; readonly snapshot: PortfolioSnapshot };

export type TranscriptItem = TranscriptPart & { readonly id: number };

export type TranscriptState = {
  readonly items: readonly TranscriptItem[];
  readonly pending: readonly TranscriptPart[];
  readonly busy: boolean;
  readonly nextId: number;
};

export type TranscriptAction =
  | { readonly type: "event"; readonly event: NeroEvent }
  | { readonly type: "user"; readonly text: string }
  | { readonly type: "notice"; readonly level: NoticeLevel; readonly lines: readonly string[] }
  | { readonly type: "clear" };

export const INITIAL_TRANSCRIPT: TranscriptState = { items: [], pending: [], busy: false, nextId: 1 };

export const transcriptReducer = (state: TranscriptState, action: TranscriptAction): TranscriptState => {
  switch (action.type) {
    case "user":
      return { ...append(state, [{ kind: "user", text: action.text }]), busy: true };
    case "notice":
      return append(state, [{ kind: "notice", level: action.level, lines: action.lines }]);
    case "clear":
      return { ...INITIAL_TRANSCRIPT, nextId: state.nextId };
    case "event":
      return applyEvent(state, action.event);
  }
};

export const applyEvent = (state: TranscriptState, event: NeroEvent): TranscriptState => {
  switch (event.type) {
    case "text_delta":
      return { ...state, pending: appendText(state.pending, event.text) };
    case "tool_started":
      return {
        ...state,
        pending: [
          ...state.pending,
          { kind: "tool", callId: event.callId, label: event.label, status: "running" },
        ],
      };
    case "tool_finished":
      return {
        ...state,
        pending: state.pending.map((part) =>
          part.kind === "tool" && part.callId === event.callId
            ? {
                ...part,
                status: event.ok ? "ok" : "failed",
                ...(event.summary === undefined ? {} : { summary: event.summary }),
              }
            : part,
        ),
      };
    case "risk_card":
      return { ...state, pending: [...state.pending, { kind: "risk_card", verdict: event.verdict }] };
    case "portfolio":
      return { ...state, pending: [...state.pending, { kind: "portfolio", snapshot: event.snapshot }] };
    case "error":
      return {
        ...state,
        pending: [...state.pending, { kind: "notice", level: "error", lines: [event.message] }],
      };
    case "done":
      return { ...append({ ...state, pending: [] }, state.pending.map(settleTool)), busy: false };
  }
};

const appendText = (pending: readonly TranscriptPart[], text: string): TranscriptPart[] => {
  const last = pending.at(-1);
  if (last?.kind === "assistant")
    return [...pending.slice(0, -1), { kind: "assistant", text: last.text + text }];
  return [...pending, { kind: "assistant", text }];
};

const settleTool = (part: TranscriptPart): TranscriptPart =>
  part.kind === "tool" && part.status === "running"
    ? { ...part, status: "failed", summary: "interrupted" }
    : part;

const append = (state: TranscriptState, parts: readonly TranscriptPart[]): TranscriptState => ({
  ...state,
  items: [...state.items, ...parts.map((part, index) => ({ ...part, id: state.nextId + index }))],
  nextId: state.nextId + parts.length,
});
