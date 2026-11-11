import type { SlashCommand } from "./slash-command.js";

export const helpCommand: SlashCommand = {
  name: "help",
  usage: "/help",
  description: "Show available commands",
  run: ({ commands, print }) => {
    const width = Math.max(...commands.map((command) => command.usage.length));
    print({
      kind: "info",
      lines: [
        "Commands:",
        ...commands.map((command) => `  ${command.usage.padEnd(width)}  ${command.description}`),
        "",
        "Tab completes commands. Esc clears the input. Ctrl+C twice exits.",
        "Nero is read-only: it never asks for seed phrases or private keys.",
      ],
    });
  },
};
