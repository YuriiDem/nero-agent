#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import {
  createFileConfigStore,
  createNeroSession,
  DEFAULT_CONFIG,
  resolveNeroHome,
} from "@nero-agent/runtime";
import { render } from "ink";
import { SLASH_COMMANDS } from "./commands/registry.js";
import { App } from "./ui/app.js";
import { placeholderSprite } from "./ui/mascot/sprites/placeholder.js";
import { createTheme } from "./ui/theme/theme.js";
import { ThemeContext } from "./ui/theme/theme-context.js";

const readVersion = (): string => {
  const pkg: unknown = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const version = typeof pkg === "object" && pkg !== null ? Reflect.get(pkg, "version") : undefined;
  return typeof version === "string" ? version : "0.0.0";
};

const HELP = `Nero: a local-first, read-only crypto safety agent.

Usage:
  nero              Start the interactive terminal UI
  nero --help       Show this help
  nero --version    Show the version

Environment:
  NERO_HOME         Config directory (default: ~/.nero)
  NO_COLOR          Disable colors
`;

const main = async (): Promise<number> => {
  const { values, positionals } = parseArgs({
    options: { help: { type: "boolean", short: "h" }, version: { type: "boolean", short: "v" } },
    allowPositionals: true,
    strict: true,
  });

  if (values.help) {
    process.stdout.write(HELP);
    return 0;
  }
  if (values.version) {
    process.stdout.write(`${readVersion()}\n`);
    return 0;
  }
  if (positionals.length > 0) {
    process.stderr.write(`Unknown command: ${positionals.join(" ")}\n\n${HELP}`);
    return 2;
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    process.stderr.write("nero needs an interactive terminal. Run `nero --help` for options.\n");
    return 1;
  }

  const config = (await createFileConfigStore(resolveNeroHome()).read()) ?? DEFAULT_CONFIG;
  const app = render(
    <ThemeContext value={createTheme()}>
      <App
        session={createNeroSession()}
        commands={SLASH_COMMANDS}
        version={readVersion()}
        {...(config.ui.mascot ? { sprite: placeholderSprite } : {})}
      />
    </ThemeContext>,
    { exitOnCtrlC: false },
  );
  await app.waitUntilExit();
  return 0;
};

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    const details = typeof error === "object" && error !== null ? Reflect.get(error, "details") : undefined;
    process.stderr.write(`nero: ${message}\n`);
    if (Array.isArray(details)) for (const line of details) process.stderr.write(`  ${String(line)}\n`);
    process.exitCode = 1;
  },
);
