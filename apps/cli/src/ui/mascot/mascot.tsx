import { Box, Text, useAnimation } from "ink";
import { useTheme } from "../theme/theme-context.js";
import { renderSprite } from "./render-sprite.js";
import type { MascotState, Sprite } from "./sprite.js";

type MascotProps = {
  readonly sprite: Sprite;
  readonly state: MascotState;
};

export const Mascot = ({ sprite, state }: MascotProps) => {
  const { color } = useTheme();
  const { frame } = useAnimation({ interval: sprite.frameMs });
  const frames = sprite.frames[state];
  const current = frames[frame % frames.length] ?? [];
  const rows = renderSprite(current, sprite.palette, { color });

  return (
    <Box flexDirection="column" flexShrink={0}>
      {rows.map((cells, row) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional and fixed per sprite
        <Text key={row}>
          {cells.map((cell, column) => (
            <Text
              // biome-ignore lint/suspicious/noArrayIndexKey: cells are positional and fixed per sprite
              key={column}
              {...(cell.fg ? { color: cell.fg } : {})}
              {...(cell.bg ? { backgroundColor: cell.bg } : {})}
            >
              {cell.char}
            </Text>
          ))}
        </Text>
      ))}
    </Box>
  );
};
