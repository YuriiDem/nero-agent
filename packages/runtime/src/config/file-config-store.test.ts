import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NeroError } from "@nero-agent/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./config-schema.js";
import { createFileConfigStore } from "./file-config-store.js";
import { CONFIG_FILE, resolveNeroHome } from "./nero-home.js";

let home: string;

beforeEach(async () => {
  home = join(await mkdtemp(join(tmpdir(), "nero-test-")), "nero-home");
});

afterEach(async () => {
  await rm(join(home, ".."), { recursive: true, force: true });
});

describe("resolveNeroHome", () => {
  it("uses NERO_HOME when set", () => {
    expect(resolveNeroHome({ NERO_HOME: "/tmp/custom" })).toBe("/tmp/custom");
  });

  it("defaults to ~/.nero", () => {
    expect(resolveNeroHome({})).toMatch(/\.nero$/);
  });
});

describe("file config store", () => {
  it("returns undefined when no config exists", async () => {
    expect(await createFileConfigStore(home).read()).toBeUndefined();
  });

  it("round-trips a config and creates the directory", async () => {
    const store = createFileConfigStore(home);
    const config = { ...DEFAULT_CONFIG, ui: { mascot: false } };
    await store.write(config);
    expect(await store.read()).toEqual(config);
  });

  it.skipIf(process.platform === "win32")("writes the file with owner-only permissions", async () => {
    await createFileConfigStore(home).write(DEFAULT_CONFIG);
    expect((await stat(join(home, CONFIG_FILE))).mode & 0o777).toBe(0o600);
    expect((await stat(home)).mode & 0o777).toBe(0o700);
  });

  it("rejects unknown fields such as an API key", async () => {
    await createFileConfigStore(home).write(DEFAULT_CONFIG);
    const path = join(home, CONFIG_FILE);
    const json = JSON.parse(await readFile(path, "utf8"));
    await writeFile(path, JSON.stringify({ ...json, apiKey: "sk-test" }));
    await expect(createFileConfigStore(home).read()).rejects.toMatchObject({ code: "invalid_config" });
  });

  it("refuses to write unknown fields", async () => {
    const withKey = { ...DEFAULT_CONFIG, apiKey: "sk-test" } as typeof DEFAULT_CONFIG;
    await expect(createFileConfigStore(home).write(withKey)).rejects.toThrow();
  });

  it("reports corrupt JSON and leaves the file untouched", async () => {
    await createFileConfigStore(home).write(DEFAULT_CONFIG);
    const path = join(home, CONFIG_FILE);
    await writeFile(path, "{ not json");
    const error = await createFileConfigStore(home)
      .read()
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(NeroError);
    expect(await readFile(path, "utf8")).toBe("{ not json");
  });
});
