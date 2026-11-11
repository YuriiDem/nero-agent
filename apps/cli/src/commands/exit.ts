import type { SlashCommand } from "./slash-command.js";

export const exitCommand: SlashCommand = {
  name: "exit",
  usage: "/exit",
  description: "Quit Nero",
  run: ({ exit }) => exit(),
};
