import { z } from "zod";
import { unsafeAddress } from "./address.js";
import { type FactKey, type FactValue, factValueSchema, isFactKey } from "./fact-catalog.js";
import { err, ok, type Result } from "./result.js";
import { type Subject, subjectSchema } from "./subject.js";

export type SourceId = string;

export type Fact<K extends FactKey = FactKey> = {
  [P in K]: {
    readonly subject: Subject;
    readonly key: P;
    readonly value: FactValue<P>;
    readonly source: SourceId;
    readonly observedAt: string;
    readonly sourceUrl?: string;
  };
}[K];

const sourceIdSchema = z.string().regex(/^[a-z][a-z0-9-]{0,31}$/);

const factEnvelopeSchema = z.object({
  subject: subjectSchema,
  key: z.string(),
  value: z.unknown(),
  source: sourceIdSchema,
  observedAt: z.iso.datetime(),
  sourceUrl: z.url({ protocol: /^https$/ }).optional(),
});

export const parseFact = (input: unknown): Result<Fact, readonly string[]> => {
  const envelope = factEnvelopeSchema.safeParse(input);
  if (!envelope.success) return err(envelope.error.issues.map((issue) => formatIssue(issue)));

  const { key, value, subject, source, observedAt, sourceUrl } = envelope.data;
  if (!isFactKey(key)) return err([`key: unknown fact key "${key}"`]);

  const parsedValue = factValueSchema(key).safeParse(value);
  if (!parsedValue.success) return err(parsedValue.error.issues.map((issue) => formatIssue(issue, "value")));

  return ok({
    subject: { ...subject, address: unsafeAddress(subject.address) },
    key,
    value: parsedValue.data,
    source,
    observedAt,
    ...(sourceUrl === undefined ? {} : { sourceUrl }),
  } as Fact);
};

const formatIssue = (issue: z.core.$ZodIssue, prefix?: string): string => {
  const path = [prefix, ...issue.path.map(String)].filter(Boolean).join(".");
  return `${path || "(root)"}: ${issue.message}`;
};
