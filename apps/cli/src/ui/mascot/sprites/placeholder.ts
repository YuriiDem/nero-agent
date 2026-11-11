import { frameFromRows, type Sprite } from "../sprite.js";

// Temporary placeholder. The real Nero character is designed later; replace this file only.
// Palette: 0 transparent, 1 body, 2 outline, 3 eye white, 4 pupil. Each row is 12 pixels.

const withEyes = (upperEyeRow: string, lowerEyeRow: string) =>
  frameFromRows([
    "002222222200",
    "021111111120",
    "211111111112",
    upperEyeRow,
    lowerEyeRow,
    "211111111112",
    "211111111112",
    "211111111112",
    "211111111112",
    "021111111120",
    "002210012200",
    "000000000000",
  ]);

const open = withEyes("211331133112", "211341134112");
const blink = withEyes("211111111112", "211221122112");
const lookLeft = withEyes("211331133112", "211431143112");
const lookUp = withEyes("211431143112", "211331133112");

export const placeholderSprite: Sprite = {
  width: 12,
  height: 12,
  palette: [null, "#6d4aff", "#2b1d66", "#ffffff", "#111111"],
  frameMs: 350,
  frames: {
    idle: [open, open, open, open, open, open, open, open, blink],
    thinking: [lookLeft, lookUp, open, lookUp],
  },
};
