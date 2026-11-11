import { type SanitizeOptions, sanitizeUntrusted } from "./sanitize-untrusted.js";

export const UNTRUSTED_TAG = "untrusted-data";

export const wrapUntrusted = (label: string, text: string, options: SanitizeOptions = {}): string => {
  const safeLabel =
    label
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .slice(0, 40) || "data";
  const body = sanitizeUntrusted(text, options).replace(/</g, "‹").replace(/>/g, "›");
  return `<${UNTRUSTED_TAG} label="${safeLabel}">\n${body}\n</${UNTRUSTED_TAG}>`;
};
