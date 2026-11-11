export const MASCOT_STATES = ["idle", "thinking"] as const;
export type MascotState = (typeof MASCOT_STATES)[number];

export type SpriteFrame = readonly (readonly number[])[];

export type Sprite = {
  readonly width: number;
  readonly height: number;
  readonly palette: readonly (string | null)[];
  readonly frameMs: number;
  readonly frames: Readonly<Record<MascotState, readonly SpriteFrame[]>>;
};

export const frameFromRows = (rows: readonly string[]): SpriteFrame =>
  rows.map((row) => [...row].map((digit) => Number.parseInt(digit, 36)));
