import { Box, Text } from "ink";
import { useTheme } from "../theme/theme-context.js";
import type { TranscriptPart } from "../transcript-state.js";
import { Spinner } from "./spinner.js";

const LEVEL_LABEL = {
  critical: "CRITICAL",
  high: "HIGH",
  medium: "MEDIUM",
  no_known_risks: "NO KNOWN RISKS",
  insufficient_data: "INSUFFICIENT DATA",
} as const;

export const TranscriptPartView = ({ part }: { readonly part: TranscriptPart }) => {
  const theme = useTheme();
  const colorOf = (value: string | undefined) => (value ? { color: value } : {});

  switch (part.kind) {
    case "user":
      return (
        <Text>
          <Text {...colorOf(theme.user)}>› </Text>
          {part.text}
        </Text>
      );
    case "assistant":
      return <Text>{part.text}</Text>;
    case "notice": {
      const tone =
        part.level === "error" ? theme.error : part.level === "warning" ? theme.warning : theme.muted;
      const prefix = part.level === "error" ? "✗ " : part.level === "warning" ? "! " : "";
      return (
        <Box flexDirection="column">
          {part.lines.map((line, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: notice lines never reorder
            <Text key={index} {...colorOf(tone)}>
              {index === 0 ? prefix : ""}
              {line}
            </Text>
          ))}
        </Box>
      );
    }
    case "tool":
      return (
        <Text>
          {part.status === "running" ? (
            <Spinner />
          ) : (
            <Text {...colorOf(part.status === "ok" ? theme.success : theme.error)}>
              {part.status === "ok" ? "✓" : "✗"}
            </Text>
          )}{" "}
          {part.label}
          {part.summary ? <Text {...colorOf(theme.muted)}> · {part.summary}</Text> : null}
        </Text>
      );
    case "risk_card": {
      const { level, complete } = part.verdict;
      return (
        <Text>
          Risk: <Text {...colorOf(theme.levels[level])}>{LEVEL_LABEL[level]}</Text>
          {complete ? "" : " (incomplete data)"}
        </Text>
      );
    }
    case "portfolio":
      return <Text>Portfolio total: ${part.snapshot.totalUsd.toFixed(2)}</Text>;
  }
};
