import { clearCommand } from "./clear.js";
import { exitCommand } from "./exit.js";
import { helpCommand } from "./help.js";
import type { SlashCommand } from "./slash-command.js";

export const SLASH_COMMANDS: readonly SlashCommand[] = [helpCommand, clearCommand, exitCommand];
