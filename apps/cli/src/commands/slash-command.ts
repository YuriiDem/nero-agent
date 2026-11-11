export type CommandOutput = {
  readonly kind: "info" | "warning" | "error";
  readonly lines: readonly string[];
};

export type CommandContext = {
  readonly args: string;
  readonly commands: readonly SlashCommand[];
  print(output: CommandOutput): void;
  clear(): void;
  exit(): void;
};

export type SlashCommand = {
  readonly name: string;
  readonly usage: string;
  readonly description: string;
  run(context: CommandContext): void;
};
