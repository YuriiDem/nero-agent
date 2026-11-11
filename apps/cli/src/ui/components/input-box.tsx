import type { InputScreen, SecretKind } from "@nero-agent/runtime";
import { Box, Text, useInput, usePaste } from "ink";
import { useState } from "react";
import { completeSlash } from "../../commands/complete.js";
import type { SlashCommand } from "../../commands/slash-command.js";
import { useTheme } from "../theme/theme-context.js";

type InputBoxProps = {
  readonly commands: readonly SlashCommand[];
  readonly busy: boolean;
  readonly screen: (text: string) => InputScreen;
  readonly onSubmit: (text: string) => void;
  readonly onBlocked: (kinds: readonly SecretKind[]) => void;
  readonly onCancel: () => void;
  readonly onInterrupt: () => void;
};

type Draft = { readonly value: string; readonly cursor: number };

const EMPTY: Draft = { value: "", cursor: 0 };

const insert = (draft: Draft, text: string): Draft => ({
  value: draft.value.slice(0, draft.cursor) + text + draft.value.slice(draft.cursor),
  cursor: draft.cursor + text.length,
});

const singleLine = (text: string): string => text.replace(/\r\n|\r|\n|\t/g, " ");

export const InputBox = ({
  commands,
  busy,
  screen,
  onSubmit,
  onBlocked,
  onCancel,
  onInterrupt,
}: InputBoxProps) => {
  const theme = useTheme();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [candidates, setCandidates] = useState<readonly string[]>([]);

  const update = (next: Draft) => {
    setDraft(next);
    setCandidates([]);
  };

  usePaste((pasted) => {
    const scan = screen(pasted);
    if (scan.blocked) {
      onBlocked(scan.kinds);
      return;
    }
    update(insert(draft, singleLine(pasted)));
  });

  useInput((input, key) => {
    if (key.ctrl && input === "c") return onInterrupt();
    if (key.escape) return draft.value ? update(EMPTY) : onCancel();
    if (key.return) {
      if (busy || draft.value.trim() === "") return;
      const text = draft.value;
      update(EMPTY);
      return onSubmit(text);
    }
    if (key.tab) {
      const completion = completeSlash(draft.value, commands);
      setDraft({ value: completion.value, cursor: completion.value.length });
      return setCandidates(completion.candidates);
    }
    if (key.backspace || key.delete) {
      if (draft.cursor === 0) return;
      return update({
        value: draft.value.slice(0, draft.cursor - 1) + draft.value.slice(draft.cursor),
        cursor: draft.cursor - 1,
      });
    }
    if (key.leftArrow) return setDraft({ ...draft, cursor: Math.max(0, draft.cursor - 1) });
    if (key.rightArrow) return setDraft({ ...draft, cursor: Math.min(draft.value.length, draft.cursor + 1) });
    if (key.home || (key.ctrl && input === "a")) return setDraft({ ...draft, cursor: 0 });
    if (key.end || (key.ctrl && input === "e")) return setDraft({ ...draft, cursor: draft.value.length });
    if (key.ctrl && input === "u") return update(EMPTY);
    if (key.ctrl || key.meta || key.upArrow || key.downArrow || input === "") return;
    update(insert(draft, singleLine(input)));
  });

  const before = draft.value.slice(0, draft.cursor);
  const atCursor = draft.value[draft.cursor] ?? " ";
  const after = draft.value.slice(draft.cursor + 1);
  const borderColor = busy ? theme.muted : theme.accent;

  return (
    <Box flexDirection="column">
      <Box borderStyle="round" paddingX={1} {...(borderColor ? { borderColor } : {})}>
        <Text>
          <Text {...(theme.accent ? { color: theme.accent } : {})}>› </Text>
          {before}
          <Text inverse>{atCursor}</Text>
          {after}
        </Text>
      </Box>
      {candidates.length > 0 ? (
        <Text {...(theme.muted ? { color: theme.muted } : {})}> {candidates.join("  ")}</Text>
      ) : null}
    </Box>
  );
};
