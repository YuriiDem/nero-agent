import type { SlashCommand } from "./slash-command.js";

export type SlashParse =
  | { readonly kind: "not_a_command" }
  | { readonly kind: "command"; readonly command: SlashCommand; readonly args: string }
  | { readonly kind: "unknown"; readonly name: string; readonly suggestion?: string };

export const parseSlash = (input: string, commands: readonly SlashCommand[]): SlashParse => {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return { kind: "not_a_command" };

  const [rawName = "", ...rest] = trimmed.slice(1).split(/\s+/);
  const name = rawName.toLowerCase();
  const command = commands.find((candidate) => candidate.name === name);
  if (command) return { kind: "command", command, args: rest.join(" ") };

  const suggestion = closestName(name, commands);
  return suggestion === undefined ? { kind: "unknown", name } : { kind: "unknown", name, suggestion };
};

const closestName = (name: string, commands: readonly SlashCommand[]): string | undefined => {
  let best: { name: string; distance: number } | undefined;
  for (const command of commands) {
    const distance = editDistance(name, command.name);
    if (distance <= 2 && (best === undefined || distance < best.distance)) {
      best = { name: command.name, distance };
    }
  }
  return best?.name;
};

const editDistance = (a: string, b: string): number => {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const substitution = (previous[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1);
      current.push(Math.min((previous[j] ?? 0) + 1, (current[j - 1] ?? 0) + 1, substitution));
    }
    previous = current;
  }
  return previous[b.length] ?? 0;
};
