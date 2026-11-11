import type { SlashCommand } from "./slash-command.js";

export const clearCommand: SlashCommand = {
  name: "clear",
  usage: "/clear",
  description: "Clear the conversation",
  run: ({ clear }) => clear(),
};
