import type { Holding } from "../ports/balance-source.js";
import type { Verdict } from "../shared/verdict.js";

export type PortfolioLine = {
  readonly holding: Holding;
  readonly usdValue?: number;
  readonly share?: number;
};

export type PortfolioSnapshot = {
  readonly lines: readonly PortfolioLine[];
  readonly totalUsd: number;
  readonly updatedAt: string;
};

export type NeroEvent =
  | { readonly type: "tool_started"; readonly callId: string; readonly tool: string; readonly label: string }
  | {
      readonly type: "tool_finished";
      readonly callId: string;
      readonly ok: boolean;
      readonly summary?: string;
    }
  | { readonly type: "risk_card"; readonly verdict: Verdict }
  | { readonly type: "text_delta"; readonly text: string }
  | { readonly type: "portfolio"; readonly snapshot: PortfolioSnapshot }
  | { readonly type: "error"; readonly code: string; readonly message: string }
  | { readonly type: "done" };

export type NeroEventType = NeroEvent["type"];
