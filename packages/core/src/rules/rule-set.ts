import { z } from "zod";
import { type FactValueType, factSpec, isFactKey } from "../shared/fact-catalog.js";
import { err, ok, type Result } from "../shared/result.js";
import {
  type Condition,
  OPERATORS,
  type Operator,
  type RawCondition,
  type RawLeaf,
  type Rule,
  rawRuleSchema,
  type Scalar,
} from "./rule-schema.js";

export type RuleSet = {
  readonly version: string;
  readonly rules: readonly Rule[];
};

export type RuleSetInput = {
  readonly version: unknown;
  readonly rules: readonly unknown[];
};

const MAX_DEPTH = 8;

const versionSchema = z.string().regex(/^\d+\.\d+\.\d+$/, "must be semver like 1.0.0");

const allowedOperators: Readonly<Record<FactValueType, readonly Operator[]>> = {
  boolean: ["eq", "neq", "exists"],
  ratio: ["eq", "neq", "gt", "gte", "lt", "lte", "in", "exists"],
  usd: ["eq", "neq", "gt", "gte", "lt", "lte", "in", "exists"],
  tags: ["contains", "in", "exists"],
};

export const loadRuleSet = (input: RuleSetInput): Result<RuleSet, readonly string[]> => {
  const errors: string[] = [];

  const version = versionSchema.safeParse(input.version);
  if (!version.success) errors.push(`version: ${version.error.issues[0]?.message ?? "invalid"}`);

  const rules: Rule[] = [];
  const seenIds = new Set<string>();

  input.rules.forEach((rawRule, index) => {
    const parsed = rawRuleSchema.safeParse(rawRule);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`rules[${index}].${issue.path.join(".")}: ${issue.message}`);
      }
      return;
    }
    const { id, when, appliesTo, ...rest } = parsed.data;
    if (seenIds.has(id)) {
      errors.push(`rules[${index}] (${id}): duplicate rule id`);
      return;
    }
    seenIds.add(id);

    const compiled = compileCondition(when, `${id}.when`, 0);
    if (!compiled.ok) {
      errors.push(...compiled.error);
      return;
    }
    rules.push(
      Object.freeze({
        ...rest,
        id,
        appliesTo:
          appliesTo.chains === undefined
            ? { kind: appliesTo.kind }
            : { kind: appliesTo.kind, chains: appliesTo.chains },
        when: compiled.value,
      }),
    );
  });

  if (errors.length > 0 || !version.success) return err(errors);
  return ok(Object.freeze({ version: version.data, rules: Object.freeze(rules) }));
};

const compileCondition = (raw: RawCondition, path: string, depth: number): Result<Condition, string[]> => {
  if (depth > MAX_DEPTH) return err([`${path}: nesting deeper than ${MAX_DEPTH}`]);

  if ("all" in raw) return compileGroup(raw.all, `${path}.all`, depth, (all) => ({ all }));
  if ("any" in raw) return compileGroup(raw.any, `${path}.any`, depth, (any) => ({ any }));
  if ("not" in raw) {
    const inner = compileCondition(raw.not, `${path}.not`, depth + 1);
    return inner.ok ? ok({ not: inner.value }) : inner;
  }
  return compileLeaf(raw, path);
};

const compileGroup = (
  items: readonly RawCondition[],
  path: string,
  depth: number,
  build: (conditions: readonly Condition[]) => Condition,
): Result<Condition, string[]> => {
  const errors: string[] = [];
  const conditions: Condition[] = [];
  items.forEach((item, index) => {
    const compiled = compileCondition(item, `${path}[${index}]`, depth + 1);
    if (compiled.ok) conditions.push(compiled.value);
    else errors.push(...compiled.error);
  });
  return errors.length > 0 ? err(errors) : ok(build(conditions));
};

const compileLeaf = (raw: RawLeaf, path: string): Result<Condition, string[]> => {
  const { fact } = raw;
  if (!isFactKey(fact)) return err([`${path}: unknown fact key "${fact}"`]);

  const present = OPERATORS.filter((op) => raw[op] !== undefined);
  const [op] = present;
  if (present.length !== 1 || op === undefined) {
    return err([`${path} (${fact}): expected exactly one operator, got ${present.length}`]);
  }

  const { type } = factSpec(fact);
  if (!allowedOperators[type].includes(op)) {
    return err([`${path} (${fact}): operator "${op}" is not allowed for ${type} facts`]);
  }

  const operand = raw[op] as Scalar | readonly Scalar[];
  const operandError = checkOperand(type, op, operand);
  if (operandError !== undefined) return err([`${path} (${fact}): ${operandError}`]);

  return ok({ fact, op, operand });
};

const checkOperand = (
  type: FactValueType,
  op: Operator,
  operand: Scalar | readonly Scalar[],
): string | undefined => {
  if (op === "exists") return undefined;
  const values = Array.isArray(operand) ? operand : [operand];
  for (const value of values) {
    const problem = checkScalar(type, value);
    if (problem !== undefined) return `operand ${JSON.stringify(value)} ${problem}`;
  }
  return undefined;
};

const checkScalar = (type: FactValueType, value: Scalar): string | undefined => {
  switch (type) {
    case "boolean":
      return typeof value === "boolean" ? undefined : "must be a boolean";
    case "ratio":
      return typeof value === "number" && value >= 0 && value <= 1 ? undefined : "must be a number in 0..1";
    case "usd":
      return typeof value === "number" && value >= 0 ? undefined : "must be a non-negative number";
    case "tags":
      return typeof value === "string" ? undefined : "must be a string";
  }
};
