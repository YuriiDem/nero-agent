import type { NeroSession, SecretKind } from "@nero-agent/runtime";
import { Box, Static, useApp, useStdout } from "ink";
import { useReducer, useRef, useState } from "react";
import { parseSlash } from "../commands/parse-slash.js";
import type { SlashCommand } from "../commands/slash-command.js";
import { Header } from "./components/header.js";
import { InputBox } from "./components/input-box.js";
import { TranscriptPartView } from "./components/transcript-part.js";
import type { Sprite } from "./mascot/sprite.js";
import { INITIAL_TRANSCRIPT, type NoticeLevel, transcriptReducer } from "./transcript-state.js";

export type AppProps = {
  readonly session: NeroSession;
  readonly commands: readonly SlashCommand[];
  readonly version: string;
  readonly sprite?: Sprite;
};

const CLEAR_SCREEN = "\u001b[2J\u001b[3J\u001b[H";

export const secretBlockedLines = (kinds: readonly SecretKind[]): string[] => [
  `This looks like a seed phrase or private key (${kinds.join(", ")}).`,
  "Nero never needs it. The input was cleared and not sent anywhere.",
];

export const App = ({ session, commands, version, sprite }: AppProps) => {
  const { exit } = useApp();
  const { write } = useStdout();
  const [transcript, dispatch] = useReducer(transcriptReducer, INITIAL_TRANSCRIPT);
  const [staticKey, setStaticKey] = useState(0);
  const [exitArmed, setExitArmed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const notice = (level: NoticeLevel, lines: readonly string[]) => dispatch({ type: "notice", level, lines });

  const stream = async (text: string) => {
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ type: "user", text });
    try {
      for await (const event of session.send(text, { signal: controller.signal })) {
        dispatch({ type: "event", event });
        if (event.type === "done") return;
      }
      dispatch({ type: "event", event: { type: "done" } });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch({ type: "event", event: { type: "error", code: "unexpected", message } });
      dispatch({ type: "event", event: { type: "done" } });
    } finally {
      abortRef.current = null;
    }
  };

  const submit = (text: string) => {
    setExitArmed(false);
    const scan = session.screenInput(text);
    if (scan.blocked) return notice("warning", secretBlockedLines(scan.kinds));

    const parsed = parseSlash(text, commands);
    if (parsed.kind === "unknown") {
      const hint = parsed.suggestion ? ` Did you mean /${parsed.suggestion}?` : " Type /help for commands.";
      return notice("warning", [`Unknown command /${parsed.name}.${hint}`]);
    }
    if (parsed.kind === "command") {
      return parsed.command.run({
        args: parsed.args,
        commands,
        print: (output) => notice(output.kind, output.lines),
        clear: () => {
          write(CLEAR_SCREEN);
          dispatch({ type: "clear" });
          setStaticKey((key) => key + 1);
        },
        exit,
      });
    }
    void stream(text.trim());
  };

  const interrupt = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      return;
    }
    if (exitArmed) return exit();
    setExitArmed(true);
    notice("info", ["Press Ctrl+C again to exit."]);
  };

  return (
    <Box flexDirection="column">
      <Static key={staticKey} items={[...transcript.items]}>
        {(item) => (
          <Box key={item.id} marginBottom={item.kind === "user" ? 0 : 1}>
            <TranscriptPartView part={item} />
          </Box>
        )}
      </Static>
      {transcript.pending.map((part, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: pending parts are append-only within a turn
        <TranscriptPartView key={index} part={part} />
      ))}
      <Header
        version={version}
        status={session.status()}
        mascotState={transcript.busy ? "thinking" : "idle"}
        {...(sprite ? { sprite } : {})}
      />
      <InputBox
        commands={commands}
        busy={transcript.busy}
        screen={session.screenInput}
        onSubmit={submit}
        onBlocked={(kinds) => notice("warning", secretBlockedLines(kinds))}
        onCancel={() => abortRef.current?.abort()}
        onInterrupt={interrupt}
      />
    </Box>
  );
};
