import { randomUUID } from "node:crypto";
import { chmod, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type ConfigStore, NeroError } from "@nero-agent/core";
import { type NeroConfig, neroConfigSchema } from "./config-schema.js";
import { CONFIG_FILE } from "./nero-home.js";

const DIR_MODE = 0o700;
const FILE_MODE = 0o600;

export const createFileConfigStore = (neroHome: string): ConfigStore<NeroConfig> => {
  const path = join(neroHome, CONFIG_FILE);

  return {
    read: async () => {
      let text: string;
      try {
        text = await readFile(path, "utf8");
      } catch (error) {
        if (isMissingFile(error)) return undefined;
        throw error;
      }
      return parseConfig(text, path);
    },

    write: async (config) => {
      const valid = neroConfigSchema.parse(config);
      await mkdir(neroHome, { recursive: true, mode: DIR_MODE });
      const tempPath = `${path}.${randomUUID()}.tmp`;
      try {
        await writeFile(tempPath, `${JSON.stringify(valid, null, 2)}\n`, { mode: FILE_MODE });
        await rename(tempPath, path);
        await chmod(path, FILE_MODE);
      } catch (error) {
        await rm(tempPath, { force: true });
        throw error;
      }
    },
  };
};

const parseConfig = (text: string, path: string): NeroConfig => {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new NeroError(
      "invalid_config",
      `${path} is not valid JSON. Fix or delete it; Nero will not overwrite it.`,
    );
  }
  const parsed = neroConfigSchema.safeParse(json);
  if (!parsed.success) {
    throw new NeroError(
      "invalid_config",
      `${path} has invalid settings. Fix or delete it; Nero will not overwrite it.`,
      parsed.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`),
    );
  }
  return parsed.data;
};

const isMissingFile = (error: unknown): boolean =>
  typeof error === "object" && error !== null && Reflect.get(error, "code") === "ENOENT";
