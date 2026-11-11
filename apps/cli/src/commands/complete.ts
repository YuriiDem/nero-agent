import type { SlashCommand } from "./slash-command.js";

export type Completion = {
  readonly value: string;
  readonly candidates: readonly string[];
};

export const completeSlash = (input: string, commands: readonly SlashCommand[]): Completion => {
  if (!input.startsWith("/") || /\s/.test(input)) return { value: input, candidates: [] };

  const typed = input.slice(1).toLowerCase();
  const matches = commands.map((command) => command.name).filter((name) => name.startsWith(typed));

  if (matches.length === 0) return { value: input, candidates: [] };
  if (matches.length === 1) return { value: `/${matches[0]} `, candidates: [] };
  return { value: `/${commonPrefix(matches)}`, candidates: matches.map((name) => `/${name}`) };
};

const commonPrefix = (values: readonly string[]): string => {
  const [first = "", ...rest] = values;
  let length = first.length;
  for (const value of rest) {
    while (!value.startsWith(first.slice(0, length))) length--;
  }
  return first.slice(0, length);
};
