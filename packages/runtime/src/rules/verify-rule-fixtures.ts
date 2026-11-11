import { access, readFile } from "node:fs/promises";
import { relative } from "node:path";
import {
  evaluateRules,
  type Fact,
  loadRuleSet,
  parseFact,
  parseSubject,
  type Subject,
} from "@nero-agent/core";
import { readRuleFiles } from "./load-rules-from-disk.js";
import { parseYaml } from "./parse-yaml.js";

export const FIXTURE_OUTCOMES = ["fires", "silent", "unknown"] as const;
export type FixtureOutcome = (typeof FIXTURE_OUTCOMES)[number];

export type FixtureFailure = {
  readonly file: string;
  readonly message: string;
};

export type FixtureReport = {
  readonly checkedRules: number;
  readonly checkedCases: number;
  readonly failures: readonly FixtureFailure[];
};

const FIXTURE_OBSERVED_AT = "2026-01-01T00:00:00.000Z";
const FIXTURE_ADDRESS = "fixture-subject";

type FixtureCase = {
  readonly name: string;
  readonly kind: unknown;
  readonly chain: unknown;
  readonly facts: Readonly<Record<string, unknown>>;
  readonly expect: FixtureOutcome;
};

export const verifyRuleFixtures = async (rulesDir: string): Promise<FixtureReport> => {
  const failures: FixtureFailure[] = [];
  let checkedCases = 0;
  const files = await readRuleFiles(rulesDir);

  for (const file of files) {
    const name = relative(rulesDir, file.path).replaceAll("\\", "/");
    const fail = (message: string) => failures.push({ file: name, message });

    if (!file.ok) {
      fail(`unreadable YAML: ${file.error.split("\n")[0]}`);
      continue;
    }

    const loaded = loadRuleSet({ version: "0.0.0", rules: [file.raw] });
    if (!loaded.ok) {
      for (const message of loaded.error) fail(message);
      continue;
    }

    if (!(await exists(file.fixturePath))) {
      fail("missing sibling .fixture.yaml");
      continue;
    }

    const cases = parseCases(parseYaml(await readFile(file.fixturePath, "utf8")));
    if (typeof cases === "string") {
      fail(cases);
      continue;
    }
    if (!cases.some((fixtureCase) => fixtureCase.expect === "fires")) fail('needs at least one "fires" case');

    for (const fixtureCase of cases) {
      checkedCases++;
      const facts = buildFacts(fixtureCase);
      if (typeof facts === "string") {
        fail(`${fixtureCase.name}: ${facts}`);
        continue;
      }
      const evaluation = evaluateRules(facts.subject, facts.list, loaded.value);
      const outcome = outcomeOf(
        evaluation.findings.length,
        evaluation.unevaluated.length,
        evaluation.applicable.length,
      );
      if (outcome !== fixtureCase.expect) {
        fail(`${fixtureCase.name}: expected ${fixtureCase.expect}, got ${outcome}`);
      }
    }
  }

  return { checkedRules: files.length, checkedCases, failures };
};

const outcomeOf = (
  findings: number,
  unevaluated: number,
  applicable: number,
): FixtureOutcome | "not_applicable" => {
  if (applicable === 0) return "not_applicable";
  if (findings > 0) return "fires";
  return unevaluated > 0 ? "unknown" : "silent";
};

const parseCases = (raw: unknown): readonly FixtureCase[] | string => {
  const cases = isRecord(raw) ? raw["cases"] : undefined;
  if (!Array.isArray(cases) || cases.length === 0) return "fixture must have a non-empty `cases` list";

  const parsed: FixtureCase[] = [];
  for (const [index, item] of cases.entries()) {
    if (!isRecord(item)) return `cases[${index}] must be a mapping`;
    const { name, subject, facts, expect } = item;
    if (typeof name !== "string") return `cases[${index}].name must be a string`;
    if (!isRecord(subject)) return `${name}: subject must be a mapping with kind and chain`;
    if (facts !== undefined && facts !== null && !isRecord(facts)) return `${name}: facts must be a mapping`;
    if (!FIXTURE_OUTCOMES.includes(expect as FixtureOutcome)) {
      return `${name}: expect must be one of ${FIXTURE_OUTCOMES.join(", ")}`;
    }
    parsed.push({
      name,
      kind: subject["kind"],
      chain: subject["chain"],
      facts: isRecord(facts) ? facts : {},
      expect: expect as FixtureOutcome,
    });
  }
  return parsed;
};

const buildFacts = (fixtureCase: FixtureCase): { subject: Subject; list: Fact[] } | string => {
  const subject = parseSubject({
    kind: fixtureCase.kind,
    chain: fixtureCase.chain,
    address: FIXTURE_ADDRESS,
  });
  if (!subject.ok) return subject.error.join("; ");

  const list: Fact[] = [];
  for (const [key, value] of Object.entries(fixtureCase.facts)) {
    const parsed = parseFact({
      subject: subject.value,
      key,
      value,
      source: "fixture",
      observedAt: FIXTURE_OBSERVED_AT,
    });
    if (!parsed.ok) return parsed.error.join("; ");
    list.push(parsed.value);
  }
  return { subject: subject.value, list };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const exists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};
