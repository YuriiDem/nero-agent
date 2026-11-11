import { describe, expect, it } from "vitest";
import { encodeBase58 } from "../test-support/builders.js";
import { decodeBase58 } from "./base58.js";
import { BIP39_ENGLISH } from "./bip39-english.js";
import { detectSecrets } from "./secret-detector.js";

const PUBLIC_TEST_MNEMONIC_12 = `${"abandon ".repeat(11)}about`;
const PUBLIC_TEST_MNEMONIC_24 = `${"abandon ".repeat(23)}art`;
const fakeSecretKeyBytes = Uint8Array.from({ length: 64 }, (_, i) => (i * 37 + 11) % 256);

describe("BIP-39 wordlist", () => {
  it("matches the canonical english.txt (SHA-256)", async () => {
    const bytes = new TextEncoder().encode(`${BIP39_ENGLISH.join("\n")}\n`);
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
    const hex = [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    expect(hex).toBe("2f5eed53a4727b4bf8880d8f3f199efc90e58503646d9ff8eff3a2ed3b24dbda");
    expect(BIP39_ENGLISH).toHaveLength(2048);
  });
});

describe("base58", () => {
  it("round-trips with leading zeros", () => {
    const bytes = Uint8Array.from([0, 0, 1, 2, 255]);
    expect(decodeBase58(encodeBase58(bytes))).toEqual(bytes);
  });

  it("rejects characters outside the alphabet", () => {
    expect(decodeBase58("0OIl")).toBeUndefined();
  });
});

describe("detectSecrets: blocks", () => {
  it.each([
    ["12-word seed", PUBLIC_TEST_MNEMONIC_12, "seed_phrase"],
    ["24-word seed", PUBLIC_TEST_MNEMONIC_24, "seed_phrase"],
    ["15-word seed, uppercase, comma separated", `${"ABANDON, ".repeat(14)}ADDRESS`, "seed_phrase"],
    ["numbered seed list", Array.from({ length: 12 }, (_, i) => `${i + 1}. zoo`).join("\n"), "seed_phrase"],
    ["seed with one typo", `${"abandon ".repeat(10)}abandn about`, "seed_phrase"],
    ["seed inside a sentence", `my wallet words are ${PUBLIC_TEST_MNEMONIC_12} is it ok?`, "seed_phrase"],
    ["64-hex without 0x", "ab".repeat(32), "hex_private_key"],
    ["64-hex with 0x", `0x${"cd".repeat(32)}`, "hex_private_key"],
    ["tx hash (blocked by design)", `check tx 0x${"9f".repeat(32)} please`, "hex_private_key"],
    ["128-hex Solana key", "e1".repeat(64), "hex_private_key"],
    ["base58 Solana secret key", encodeBase58(fakeSecretKeyBytes), "solana_secret_key"],
    ["Solana CLI keypair JSON", JSON.stringify([...fakeSecretKeyBytes]), "solana_keypair_json"],
    ["xprv", `xprv${"9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk".repeat(3)}`, "extended_private_key"],
  ])("%s", (_name, text, kind) => {
    const scan = detectSecrets(text);
    expect(scan.blocked).toBe(true);
    expect(scan.kinds).toContain(kind);
  });

  it("never echoes the secret back", () => {
    expect(JSON.stringify(detectSecrets(PUBLIC_TEST_MNEMONIC_12))).not.toContain("abandon");
  });
});

describe("detectSecrets: allows", () => {
  it.each([
    ["EVM address", "check 0x6b175474e89094c44da98b954eedeac495271d0f on ethereum"],
    ["Solana mint address", "is So11111111111111111111111111111111111111112 a scam?"],
    ["40-hex without 0x", "6b175474e89094c44da98b954eedeac495271d0f"],
    [
      "ordinary English",
      "Can you check this token for me? I think the team behind it might have a hidden owner and " +
        "I want to know about any risk before I add it to my wallet next week.",
    ],
    ["token names", "PEPE, Wrapped Ether, USD Coin, Bonk, dogwifhat"],
    ["11 seed words only", "abandon ".repeat(10).trim()],
    ["JSON array with values over 255", JSON.stringify(Array.from({ length: 64 }, () => 999))],
    ["short numbers", "my balance is 1234.5678 and fee 0.003"],
  ])("%s", (_name, text) => {
    expect(detectSecrets(text)).toEqual({ blocked: false, kinds: [] });
  });
});
