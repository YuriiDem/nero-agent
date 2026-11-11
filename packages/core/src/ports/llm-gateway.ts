import type { CollectOptions } from "./evidence-source.js";

export type LlmCapabilities = {
  readonly tools: boolean;
  readonly structuredOutput: boolean;
  readonly local: boolean;
};

export type LlmMessage = {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
};

export type LlmGateway = {
  readonly modelId: string;
  readonly capabilities: LlmCapabilities;
  streamText(messages: readonly LlmMessage[], options: CollectOptions): AsyncIterable<string>;
  generateJson(messages: readonly LlmMessage[], options: CollectOptions): Promise<unknown>;
};
