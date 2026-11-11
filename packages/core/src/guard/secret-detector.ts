import { decodeBase58 } from "./base58.js";
import { BIP39_ENGLISH } from "./bip39-english.js";

export const SECRET_KINDS = [
  "seed_phrase",
  "hex_private_key",
  "solana_secret_key",
  "solana_keypair_json",
  "extended_private_key",
] as const;
export type SecretKind = (typeof SECRET_KINDS)[number];

export type SecretScan = {
  readonly blocked: boolean;
  readonly kinds: readonly SecretKind[];
};

const SEED_WINDOW = 12;
const SEED_MIN_KNOWN_WORDS = 11;
const BIP39_WORDS = new Set(BIP39_ENGLISH);

const HEX_KEY = /(?<![0-9a-fA-F])(?:0x)?(?:[0-9a-fA-F]{128}|[0-9a-fA-F]{64})(?![0-9a-fA-F])/;
const BASE58_CANDIDATE = /(?<![1-9A-HJ-NP-Za-km-z])[1-9A-HJ-NP-Za-km-z]{80,90}(?![1-9A-HJ-NP-Za-km-z])/g;
const KEYPAIR_JSON = /\[\s*(?:\d{1,3}\s*,\s*){63}\d{1,3}\s*\]/;
const EXTENDED_PRIVATE_KEY = /(?<![A-Za-z0-9])[a-zA-Z]prv[1-9A-HJ-NP-Za-km-z]{100,}/;

const SOLANA_SECRET_KEY_BYTES = 64;

export const detectSecrets = (text: string): SecretScan => {
  const kinds: SecretKind[] = [];
  if (containsSeedPhrase(text)) kinds.push("seed_phrase");
  if (HEX_KEY.test(text)) kinds.push("hex_private_key");
  if (containsSolanaSecretKey(text)) kinds.push("solana_secret_key");
  if (containsKeypairJson(text)) kinds.push("solana_keypair_json");
  if (EXTENDED_PRIVATE_KEY.test(text)) kinds.push("extended_private_key");
  return { blocked: kinds.length > 0, kinds };
};

const containsSeedPhrase = (text: string): boolean => {
  const tokens = text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);
  if (tokens.length < SEED_WINDOW) return false;

  const known = tokens.map((token) => (BIP39_WORDS.has(token) ? 1 : 0));
  let inWindow = known.slice(0, SEED_WINDOW).reduce<number>((sum, value) => sum + value, 0);
  if (inWindow >= SEED_MIN_KNOWN_WORDS) return true;

  for (let end = SEED_WINDOW; end < known.length; end++) {
    inWindow += (known[end] ?? 0) - (known[end - SEED_WINDOW] ?? 0);
    if (inWindow >= SEED_MIN_KNOWN_WORDS) return true;
  }
  return false;
};

const containsSolanaSecretKey = (text: string): boolean => {
  for (const [candidate] of text.matchAll(BASE58_CANDIDATE)) {
    if (decodeBase58(candidate)?.length === SOLANA_SECRET_KEY_BYTES) return true;
  }
  return false;
};

const containsKeypairJson = (text: string): boolean => {
  const match = KEYPAIR_JSON.exec(text);
  if (match === null) return false;
  return match[0]
    .replace(/[[\]\s]/g, "")
    .split(",")
    .every((value) => Number(value) <= 255);
};
