import { z } from "zod";

export const FACT_VALUE_TYPES = ["boolean", "ratio", "usd", "tags"] as const;
export type FactValueType = (typeof FACT_VALUE_TYPES)[number];

export type WorseDirection = "true" | "false" | "higher" | "lower" | "union";

export type FactSpec = {
  readonly type: FactValueType;
  readonly worse: WorseDirection;
  readonly description: string;
};

export const FACT_CATALOG = {
  "token.is_honeypot": {
    type: "boolean",
    worse: "true",
    description: "Sells are blocked or fail in simulation.",
  },
  "token.buy_tax": { type: "ratio", worse: "higher", description: "Share of a buy taken as tax (0..1)." },
  "token.sell_tax": { type: "ratio", worse: "higher", description: "Share of a sell taken as tax (0..1)." },
  "token.mint_authority_active": {
    type: "boolean",
    worse: "true",
    description: "Someone can still mint new supply.",
  },
  "token.freeze_authority_active": {
    type: "boolean",
    worse: "true",
    description: "Someone can freeze holder balances.",
  },
  "token.owner_can_change_balance": {
    type: "boolean",
    worse: "true",
    description: "The owner can modify holder balances.",
  },
  "token.hidden_owner": { type: "boolean", worse: "true", description: "The contract has a hidden owner." },
  "token.is_proxy": { type: "boolean", worse: "true", description: "The contract logic can be replaced." },
  "token.is_open_source": {
    type: "boolean",
    worse: "false",
    description: "The contract source is verified.",
  },
  "token.liquidity_usd": { type: "usd", worse: "lower", description: "Total DEX liquidity in USD." },
  "token.top10_holder_share": {
    type: "ratio",
    worse: "higher",
    description: "Share of supply held by the top 10 holders (0..1).",
  },
  "token.lp_locked_share": {
    type: "ratio",
    worse: "lower",
    description: "Share of LP tokens locked or burned (0..1).",
  },
  "address.is_malicious": {
    type: "boolean",
    worse: "true",
    description: "The address is on a known malicious list.",
  },
  "address.malicious_tags": {
    type: "tags",
    worse: "union",
    description: "Labels from malicious-address lists (e.g. phishing, drainer).",
  },
} as const satisfies Record<string, FactSpec>;

export type FactKey = keyof typeof FACT_CATALOG;

type ValueOfType<T extends FactValueType> = T extends "boolean"
  ? boolean
  : T extends "tags"
    ? readonly string[]
    : number;

export type FactValue<K extends FactKey> = ValueOfType<(typeof FACT_CATALOG)[K]["type"]>;

export const FACT_KEYS = Object.keys(FACT_CATALOG) as FactKey[];

export const isFactKey = (value: string): value is FactKey => Object.hasOwn(FACT_CATALOG, value);

export const factSpec = (key: FactKey): FactSpec => FACT_CATALOG[key];

const valueSchemas: Record<FactValueType, z.ZodType> = {
  boolean: z.boolean(),
  ratio: z.number().min(0).max(1),
  usd: z.number().nonnegative().finite(),
  tags: z.array(z.string().min(1).max(64)).max(32),
};

export const factValueSchema = (key: FactKey): z.ZodType => valueSchemas[factSpec(key).type];

const unionTags = (a: readonly string[], b: readonly string[]): readonly string[] =>
  [...new Set([...a, ...b])].sort();

export const worseValue = <K extends FactKey>(key: K, a: FactValue<K>, b: FactValue<K>): FactValue<K> => {
  const direction = factSpec(key).worse;
  switch (direction) {
    case "true":
      return (a === true ? a : b) as FactValue<K>;
    case "false":
      return (a === false ? a : b) as FactValue<K>;
    case "higher":
      return ((a as number) >= (b as number) ? a : b) as FactValue<K>;
    case "lower":
      return ((a as number) <= (b as number) ? a : b) as FactValue<K>;
    case "union":
      return unionTags(a as readonly string[], b as readonly string[]) as FactValue<K>;
  }
};
