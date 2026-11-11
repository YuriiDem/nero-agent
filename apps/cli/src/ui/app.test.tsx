import { createNeroSession, type NeroEvent, type NeroSession } from "@nero-agent/runtime";
import { render } from "ink-testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SLASH_COMMANDS } from "../commands/registry.js";
import { App } from "./app.js";
import { placeholderSprite } from "./mascot/sprites/placeholder.js";
import { createTheme } from "./theme/theme.js";
import { ThemeContext } from "./theme/theme-context.js";

const TEST_MNEMONIC = `${"abandon ".repeat(11)}about`;
const ENTER = "\r";
const TAB = "\t";

const mount = (session: NeroSession = createNeroSession()) =>
  render(
    <ThemeContext value={createTheme({ NO_COLOR: "1" })}>
      <App session={session} commands={SLASH_COMMANDS} version="0.0.0-test" sprite={placeholderSprite} />
    </ThemeContext>,
  );

let app: ReturnType<typeof mount> | undefined;

afterEach(() => {
  app?.unmount();
  app = undefined;
});

const type = async (text: string) => {
  for (const char of text) {
    app?.stdin.write(char);
    await tick();
  }
};

const tick = () => new Promise((resolve) => setTimeout(resolve, 15));

const frame = (): string => app?.frames.join("\n") ?? "";

describe("App", () => {
  it("shows the header with version, status and the read-only promise", async () => {
    app = mount();
    await tick();
    expect(app.lastFrame()).toContain("Nero v0.0.0-test");
    expect(app.lastFrame()).toContain("none configured");
    expect(app.lastFrame()).toContain("read-only");
  });

  it("completes /he to /help with Tab and runs it", async () => {
    app = mount();
    await type("/he");
    await type(TAB);
    expect(app.lastFrame()).toContain("/help");
    await type(ENTER);
    await vi.waitFor(() => expect(frame()).toContain("Commands:"));
    expect(frame()).toContain("/clear");
    expect(frame()).toContain("/exit");
  });

  it("suggests a command for typos", async () => {
    app = mount();
    await type(`/hepl${ENTER}`);
    await vi.waitFor(() => expect(frame()).toContain("Did you mean /help?"));
  });

  it("streams the session reply for plain text", async () => {
    app = mount();
    await type(`hello${ENTER}`);
    await vi.waitFor(() => expect(frame()).toContain("No model is configured yet"));
    expect(frame()).toContain("› hello");
  });

  it("renders tool progress events", async () => {
    const session: NeroSession = {
      ...createNeroSession(),
      async *send(): AsyncIterable<NeroEvent> {
        yield { type: "tool_started", callId: "c1", tool: "check", label: "Checking token" };
        yield { type: "tool_finished", callId: "c1", ok: true, summary: "2/2 sources" };
        yield { type: "done" };
      },
    };
    app = mount(session);
    await type(`check it${ENTER}`);
    await vi.waitFor(() => expect(frame()).toContain("✓ Checking token · 2/2 sources"));
  });

  it("blocks a typed seed phrase: not echoed, not sent, input cleared", async () => {
    const send = vi.fn(createNeroSession().send);
    app = mount({ ...createNeroSession(), send });
    app.stdin.write(TEST_MNEMONIC);
    await tick();
    await type(ENTER);
    await vi.waitFor(() => expect(app?.lastFrame()).toContain("This looks like a seed phrase"));
    expect(send).not.toHaveBeenCalled();
    expect(app.lastFrame()).not.toContain("abandon");
  });

  it("blocks a bracketed paste of a seed phrase before it reaches the input box", async () => {
    app = mount();
    app.stdin.write(`\u001b[200~${TEST_MNEMONIC}\u001b[201~`);
    await vi.waitFor(() => expect(app?.lastFrame()).toContain("This looks like a seed phrase"));
    expect(frame()).not.toContain("abandon");
  });

  it("/clear empties the conversation", async () => {
    app = mount();
    await type(`hello${ENTER}`);
    await vi.waitFor(() => expect(frame()).toContain("No model is configured yet"));
    await type(`/clear${ENTER}`);
    await tick();
    expect(app.lastFrame()).not.toContain("No model is configured yet");
  });
});
