import { type CollectOptions, detectSecrets, type NeroEvent, type SecretKind } from "@nero-agent/core";

export type InputScreen = {
  readonly blocked: boolean;
  readonly kinds: readonly SecretKind[];
};

export type SessionStatus = {
  readonly model: string | null;
  readonly sources: readonly string[];
};

export type NeroSession = {
  screenInput(text: string): InputScreen;
  send(text: string, options: CollectOptions): AsyncIterable<NeroEvent>;
  status(): SessionStatus;
};

export const NO_MODEL_REPLY = "No model is configured yet. Model setup arrives with /model in M3.";

export const createNeroSession = (): NeroSession => {
  const screenInput = (text: string): InputScreen => detectSecrets(text);

  async function* send(text: string, options: CollectOptions): AsyncIterable<NeroEvent> {
    if (screenInput(text).blocked) {
      yield {
        type: "error",
        code: "secret_detected",
        message: "Input looked like a secret and was not sent.",
      };
      yield { type: "done" };
      return;
    }
    if (options.signal.aborted) {
      yield { type: "done" };
      return;
    }
    yield { type: "text_delta", text: NO_MODEL_REPLY };
    yield { type: "done" };
  }

  return {
    screenInput,
    send,
    status: () => ({ model: null, sources: [] }),
  };
};
