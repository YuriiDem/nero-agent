import type { SessionStatus } from "@nero-agent/runtime";
import { Box, Text } from "ink";
import { Mascot } from "../mascot/mascot.js";
import type { MascotState, Sprite } from "../mascot/sprite.js";
import { useTheme } from "../theme/theme-context.js";

type HeaderProps = {
  readonly version: string;
  readonly status: SessionStatus;
  readonly sprite?: Sprite;
  readonly mascotState: MascotState;
};

export const Header = ({ version, status, sprite, mascotState }: HeaderProps) => {
  const theme = useTheme();
  const muted = theme.muted ? { color: theme.muted } : {};
  const sources = status.sources.length > 0 ? status.sources.join(", ") : "none connected";

  return (
    <Box gap={2} marginTop={1}>
      {sprite ? <Mascot sprite={sprite} state={mascotState} /> : null}
      <Box flexDirection="column" justifyContent="center">
        <Text bold {...(theme.accent ? { color: theme.accent } : {})}>
          Nero <Text {...muted}>v{version}</Text>
        </Text>
        <Text>
          <Text {...muted}>model </Text>
          {status.model ?? "none configured"}
        </Text>
        <Text>
          <Text {...muted}>sources </Text>
          {sources}
        </Text>
        <Text {...muted}>read-only · never asks for seed phrases or private keys · /help</Text>
      </Box>
    </Box>
  );
};
