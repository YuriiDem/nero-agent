import { z } from "zod";
import { CHAIN_FAMILIES, CHAINS, type Chain, type ChainFamily } from "../shared/chain.js";
import type { FactKey } from "../shared/fact-catalog.js";
import { SEVERITIES, type Severity } from "../shared/finding.js";
import { SUBJECT_KINDS, type SubjectKind } from "../shared/subject.js";

export const OPERATORS = ["eq", "neq", "gt", "gte", "lt", "lte", "in", "contains", "exists"] as const;
export type Operator = (typeof OPERATORS)[number];

export type Scalar = boolean | number | string;

export type LeafCondition = {
  readonly fact: FactKey;
  readonly op: Operator;
  readonly operand: Scalar | readonly Scalar[];
};

export type Condition =
  | LeafCondition
  | { readonly all: readonly Condition[] }
  | { readonly any: readonly Condition[] }
  | { readonly not: Condition };

export type Rule = {
  readonly id: string;
  readonly title: string;
  readonly severity: Severity;
  readonly appliesTo: {
    readonly kind: SubjectKind;
    readonly chains?: readonly (Chain | ChainFamily)[];
  };
  readonly when: Condition;
  readonly explain: string;
};

const scalarSchema = z.union([z.boolean(), z.number().finite(), z.string().min(1).max(64)]);

const rawLeafSchema = z
  .object({
    fact: z.string(),
    eq: scalarSchema.optional(),
    neq: scalarSchema.optional(),
    gt: z.number().finite().optional(),
    gte: z.number().finite().optional(),
    lt: z.number().finite().optional(),
    lte: z.number().finite().optional(),
    in: z.array(scalarSchema).min(1).max(64).optional(),
    contains: z.string().min(1).max(64).optional(),
    exists: z.literal(true).optional(),
  })
  .strict();

export type RawLeaf = z.infer<typeof rawLeafSchema>;

export type RawCondition =
  | RawLeaf
  | { readonly all: readonly RawCondition[] }
  | { readonly any: readonly RawCondition[] }
  | { readonly not: RawCondition };

export const rawConditionSchema: z.ZodType<RawCondition> = z.lazy(() =>
  z.union([
    z.object({ all: z.array(rawConditionSchema).min(1).max(32) }).strict(),
    z.object({ any: z.array(rawConditionSchema).min(1).max(32) }).strict(),
    z.object({ not: rawConditionSchema }).strict(),
    rawLeafSchema,
  ]),
);

export const rawRuleSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(\.[a-z0-9_-]+)+$/, "must look like evm.token.honeypot"),
    title: z.string().min(1).max(120),
    severity: z.enum(SEVERITIES),
    appliesTo: z
      .object({
        kind: z.enum(SUBJECT_KINDS),
        chains: z
          .array(z.enum([...CHAINS, ...CHAIN_FAMILIES]))
          .min(1)
          .optional(),
      })
      .strict(),
    when: rawConditionSchema,
    explain: z.string().min(1).max(500),
  })
  .strict();

export type RawRule = z.infer<typeof rawRuleSchema>;
