export type SanitizeOptions = {
  readonly maxLength?: number;
  readonly multiline?: boolean;
};

export const TRUNCATION_MARKER = "…[truncated]";
const DEFAULT_MAX_LENGTH = 200;

const ANSI_CSI = /\u001b\[[0-?]*[ -/]*[@-~]/g;
const ANSI_OSC = /\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)?/g;
const ANSI_OTHER = /\u001b[@-_]?/g;
const CONTROL_EXCEPT_NEWLINE_TAB = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g;
const INVISIBLE_FORMATTING =
  /[\u{61c}\u{200b}-\u{200f}\u{202a}-\u{202e}\u{2060}-\u{2069}\u{feff}]|[\u{e0000}-\u{e007f}]/gu;

export const sanitizeUntrusted = (text: string, options: SanitizeOptions = {}): string => {
  const maxLength = options.maxLength ?? DEFAULT_MAX_LENGTH;

  let clean = text
    .normalize("NFKC")
    .replace(ANSI_CSI, "")
    .replace(ANSI_OSC, "")
    .replace(ANSI_OTHER, "")
    .replace(CONTROL_EXCEPT_NEWLINE_TAB, "")
    .replace(INVISIBLE_FORMATTING, "");

  clean = options.multiline
    ? clean.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n")
    : clean.replace(/\s+/g, " ");
  clean = clean.trim();

  const codePoints = [...clean];
  if (codePoints.length <= maxLength) return clean;
  return codePoints.slice(0, maxLength).join("") + TRUNCATION_MARKER;
};
