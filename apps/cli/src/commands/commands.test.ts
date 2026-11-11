import { describe, expect, it } from "vitest";
import { completeSlash } from "./complete.js";
import { parseSlash } from "./parse-slash.js";
import { SLASH_COMMANDS } from "./registry.js";
import type { CommandOutput, SlashCommand } from "./slash-command.js";

const noop = () => undefined;
const fake = (name: string): SlashCommand => ({ name, usage: `/${name}`, description: name, run: noop });

describe("parseSlash", () => {
  it("ignores plain text", () => {
    expect(parseSlash("is this token safe?", SLASH_COMMANDS)).toEqual({ kind: "not_a_command" });
  });

  it("parses a command with arguments, case-insensitively", () => {
    const parsed = parseSlash("  /HELP me please ", SLASH_COMMANDS);
    expect(parsed).toMatchObject({ kind: "command", args: "me please" });
    expect(parsed.kind === "command" && parsed.command.name).toBe("help");
  });

  it("suggests the closest command for typos", () => {
    expect(parseSlash("/hepl", SLASH_COMMANDS)).toEqual({
      kind: "unknown",
      name: "hepl",
      suggestion: "help",
    });
  });

  it("gives no suggestion when nothing is close", () => {
    expect(parseSlash("/portfolio", SLASH_COMMANDS)).toEqual({ kind: "unknown", name: "portfolio" });
  });
});

describe("completeSlash", () => {
  const commands = [fake("check"), fake("clear"), fake("exit"), fake("help")];

  it("completes a unique prefix and adds a space", () => {
    expect(completeSlash("/he", commands)).toEqual({ value: "/help ", candidates: [] });
  });

  it("completes to the common prefix and lists candidates", () => {
    expect(completeSlash("/c", commands)).toEqual({ value: "/c", candidates: ["/check", "/clear"] });
    expect(completeSlash("/ch", commands)).toEqual({ value: "/check ", candidates: [] });
  });

  it("lists all commands for a bare slash", () => {
    expect(completeSlash("/", commands).candidates).toHaveLength(4);
  });

  it("leaves plain text and command arguments alone", () => {
    expect(completeSlash("hello", commands)).toEqual({ value: "hello", candidates: [] });
    expect(completeSlash("/check 0x1", commands)).toEqual({ value: "/check 0x1", candidates: [] });
  });
});

describe("/help", () => {
  it("lists every registered command", () => {
    const printed: CommandOutput[] = [];
    const help = SLASH_COMMANDS.find((command) => command.name === "help");
    help?.run({
      args: "",
      commands: SLASH_COMMANDS,
      print: (output) => printed.push(output),
      clear: noop,
      exit: noop,
    });
    const text = printed.flatMap((output) => output.lines).join("\n");
    for (const command of SLASH_COMMANDS) expect(text).toContain(command.usage);
  });
});
