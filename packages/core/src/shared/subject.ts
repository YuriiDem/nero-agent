import { z } from "zod";
import { type Address, unsafeAddress } from "./address.js";
import { CHAINS, type Chain } from "./chain.js";
import { err, ok, type Result } from "./result.js";

export const SUBJECT_KINDS = ["token", "address"] as const;
export type SubjectKind = (typeof SUBJECT_KINDS)[number];

export type Subject = {
  readonly kind: SubjectKind;
  readonly chain: Chain;
  readonly address: Address;
};

export const subjectSchema = z.object({
  kind: z.enum(SUBJECT_KINDS),
  chain: z.enum(CHAINS),
  address: z.string().min(1).max(128),
});

export const parseSubject = (input: unknown): Result<Subject, readonly string[]> => {
  const parsed = subjectSchema.safeParse(input);
  if (!parsed.success) {
    return err(parsed.error.issues.map((issue) => `subject.${issue.path.join(".")}: ${issue.message}`));
  }
  return ok({ ...parsed.data, address: unsafeAddress(parsed.data.address) });
};

export const sameSubject = (a: Subject, b: Subject): boolean =>
  a.kind === b.kind && a.chain === b.chain && a.address === b.address;
