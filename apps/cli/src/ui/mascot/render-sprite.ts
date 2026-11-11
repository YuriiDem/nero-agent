import type { SpriteFrame } from "./sprite.js";

export type Cell = {
  readonly char: string;
  readonly fg?: string;
  readonly bg?: string;
};

export type RenderOptions = {
  readonly color: boolean;
};

const UPPER_HALF = "▀";
const LOWER_HALF = "▄";
const FULL = "█";

export const renderSprite = (
  frame: SpriteFrame,
  palette: readonly (string | null)[],
  { color }: RenderOptions,
): Cell[][] => {
  const colorAt = (row: number, column: number): string | null => palette[frame[row]?.[column] ?? 0] ?? null;
  const width = Math.max(0, ...frame.map((row) => row.length));
  const lines: Cell[][] = [];

  for (let row = 0; row < frame.length; row += 2) {
    const cells: Cell[] = [];
    for (let column = 0; column < width; column++) {
      cells.push(toCell(colorAt(row, column), colorAt(row + 1, column), color));
    }
    lines.push(cells);
  }
  return lines;
};

const toCell = (top: string | null, bottom: string | null, color: boolean): Cell => {
  if (top === null && bottom === null) return { char: " " };
  if (!color) {
    if (top !== null && bottom !== null) return { char: FULL };
    return { char: top !== null ? UPPER_HALF : LOWER_HALF };
  }
  if (top !== null && bottom !== null) return { char: UPPER_HALF, fg: top, bg: bottom };
  if (top !== null) return { char: UPPER_HALF, fg: top };
  return bottom === null ? { char: " " } : { char: LOWER_HALF, fg: bottom };
};
