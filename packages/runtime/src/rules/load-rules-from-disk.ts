import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadRuleSet, NeroError, type RuleSet } from "@nero-agent/core";
import { parseYaml } from "./parse-yaml.js";

export const MANIFEST_FILE = "manifest.yaml";
const FIXTURE_SUFFIX = ".fixture.yaml";

export type RuleFile = {
  readonly path: string;
  readonly fixturePath: string;
} & ({ readonly ok: true; readonly raw: unknown } | { readonly ok: false; readonly error: string });

export const listRuleFiles = async (rulesDir: string): Promise<readonly string[]> => {
  const entries = await readdir(rulesDir, { recursive: true });
  return entries
    .map((entry) => entry.replaceAll("\\", "/"))
    .filter((entry) => entry.endsWith(".yaml") && !entry.endsWith(FIXTURE_SUFFIX) && entry !== MANIFEST_FILE)
    .sort()
    .map((entry) => join(rulesDir, entry));
};

export const fixturePathFor = (rulePath: string): string => rulePath.replace(/\.yaml$/, FIXTURE_SUFFIX);

export const readRuleFiles = async (rulesDir: string): Promise<readonly RuleFile[]> => {
  const paths = await listRuleFiles(rulesDir);
  return Promise.all(
    paths.map(async (path): Promise<RuleFile> => {
      const fixturePath = fixturePathFor(path);
      try {
        return { path, fixturePath, ok: true, raw: parseYaml(await readFile(path, "utf8")) };
      } catch (error) {
        return {
          path,
          fixturePath,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );
};

export const loadRulesFromDisk = async (rulesDir: string): Promise<RuleSet> => {
  const manifest = parseYaml(await readFile(join(rulesDir, MANIFEST_FILE), "utf8"));
  const version =
    typeof manifest === "object" && manifest !== null ? Reflect.get(manifest, "version") : undefined;
  const files = await readRuleFiles(rulesDir);

  const unreadable = files.flatMap((file) => (file.ok ? [] : [`${file.path}: ${file.error}`]));
  if (unreadable.length > 0)
    throw new NeroError("invalid_rule_set", `Unreadable rules in ${rulesDir}`, unreadable);

  const result = loadRuleSet({ version, rules: files.flatMap((file) => (file.ok ? [file.raw] : [])) });
  if (!result.ok) throw new NeroError("invalid_rule_set", `Invalid rules in ${rulesDir}`, result.error);
  return result.value;
};
