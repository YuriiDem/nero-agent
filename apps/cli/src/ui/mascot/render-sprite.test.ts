import { describe, expect, it } from "vitest";
import { renderSprite } from "./render-sprite.js";
import { MASCOT_STATES } from "./sprite.js";
import { placeholderSprite } from "./sprites/placeholder.js";

const palette = [null, "#aa0000", "#00bb00"];

describe("renderSprite", () => {
  it("packs two pixel rows into one row of half-block cells", () => {
    const cells = renderSprite(
      [
        [1, 1, 0, 0],
        [2, 0, 2, 0],
      ],
      palette,
      { color: true },
    );
    expect(cells).toEqual([
      [
        { char: "▀", fg: "#aa0000", bg: "#00bb00" },
        { char: "▀", fg: "#aa0000" },
        { char: "▄", fg: "#00bb00" },
        { char: " " },
      ],
    ]);
  });

  it("pads an odd final row with transparency", () => {
    expect(renderSprite([[1], [1], [2]], palette, { color: true })).toHaveLength(2);
    expect(renderSprite([[1], [1], [2]], palette, { color: true })[1]).toEqual([
      { char: "▀", fg: "#00bb00" },
    ]);
  });

  it("renders shapes without color when color is off", () => {
    const cells = renderSprite(
      [
        [1, 1, 0, 0],
        [2, 0, 2, 0],
      ],
      palette,
      { color: false },
    );
    expect(cells[0]?.map((cell) => cell.char).join("")).toBe("█▀▄ ");
    expect(cells.flat().every((cell) => cell.fg === undefined && cell.bg === undefined)).toBe(true);
  });
});

describe("placeholder sprite", () => {
  it.each(MASCOT_STATES)("every %s frame matches the declared size and palette", (state) => {
    const frames = placeholderSprite.frames[state];
    expect(frames.length).toBeGreaterThan(0);
    for (const frame of frames) {
      expect(frame).toHaveLength(placeholderSprite.height);
      for (const row of frame) {
        expect(row).toHaveLength(placeholderSprite.width);
        for (const index of row) expect(index).toBeLessThan(placeholderSprite.palette.length);
      }
    }
  });

  it("idle includes a blink frame", () => {
    const distinct = new Set(placeholderSprite.frames.idle.map((frame) => JSON.stringify(frame)));
    expect(distinct.size).toBeGreaterThan(1);
  });
});
