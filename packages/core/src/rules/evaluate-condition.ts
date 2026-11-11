import type { FactKey } from "../shared/fact-catalog.js";
import type { ResolvedFacts } from "./resolve-facts.js";
import type { Condition, LeafCondition, Scalar } from "./rule-schema.js";

export type Truth = "true" | "false" | "unknown";

const fromBoolean = (value: boolean): Truth => (value ? "true" : "false");

export const evaluateCondition = (condition: Condition, facts: ResolvedFacts): Truth => {
  if ("all" in condition) return allOf(condition.all.map((c) => evaluateCondition(c, facts)));
  if ("any" in condition) return anyOf(condition.any.map((c) => evaluateCondition(c, facts)));
  if ("not" in condition) return negate(evaluateCondition(condition.not, facts));
  return evaluateLeaf(condition, facts);
};

export const allOf = (values: readonly Truth[]): Truth => {
  if (values.includes("false")) return "false";
  return values.includes("unknown") ? "unknown" : "true";
};

export const anyOf = (values: readonly Truth[]): Truth => {
  if (values.includes("true")) return "true";
  return values.includes("unknown") ? "unknown" : "false";
};

export const negate = (value: Truth): Truth => {
  if (value === "unknown") return value;
  return value === "true" ? "false" : "true";
};

const evaluateLeaf = ({ fact, op, operand }: LeafCondition, facts: ResolvedFacts): Truth => {
  const resolved = facts.get(fact);
  if (op === "exists") return fromBoolean(resolved !== undefined);
  if (resolved === undefined) return "unknown";

  const { value } = resolved;
  if (Array.isArray(value)) return evaluateTags(value, op, operand);

  const scalar = value as Scalar;
  switch (op) {
    case "eq":
      return fromBoolean(scalar === operand);
    case "neq":
      return fromBoolean(scalar !== operand);
    case "gt":
      return fromBoolean((scalar as number) > (operand as number));
    case "gte":
      return fromBoolean((scalar as number) >= (operand as number));
    case "lt":
      return fromBoolean((scalar as number) < (operand as number));
    case "lte":
      return fromBoolean((scalar as number) <= (operand as number));
    case "in":
      return fromBoolean((operand as readonly Scalar[]).includes(scalar));
    case "contains":
      return "false";
  }
};

const evaluateTags = (
  tags: readonly string[],
  op: LeafCondition["op"],
  operand: LeafCondition["operand"],
): Truth => {
  if (op === "contains") return fromBoolean(tags.includes(operand as string));
  if (op === "in")
    return fromBoolean((operand as readonly Scalar[]).some((item) => tags.includes(item as string)));
  return "false";
};

export const referencedFacts = (condition: Condition): readonly FactKey[] => {
  if ("all" in condition) return condition.all.flatMap(referencedFacts);
  if ("any" in condition) return condition.any.flatMap(referencedFacts);
  if ("not" in condition) return referencedFacts(condition.not);
  return [condition.fact];
};
