import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const roots = ["apps", "packages"];
const skippedDirs = new Set(["node_modules", "dist", "coverage"]);
const sourceFile = /\.(ts|tsx|js|mjs|cjs)$/;

const bannedIdentifiers = [
  "privateKeyToAccount",
  "mnemonicToAccount",
  "hdKeyToAccount",
  "signTransaction",
  "signMessage",
  "signTypedData",
  "sendTransaction",
  "sendRawTransaction",
  "eth_sendTransaction",
  "eth_sendRawTransaction",
  "eth_sign",
  "personal_sign",
  "Keypair",
];

const pattern = new RegExp(String.raw`\b(${bannedIdentifiers.join("|")})\b`);

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (skippedDirs.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (sourceFile.test(entry.name)) yield path;
  }
}

const violations = [];
for (const root of roots) {
  for await (const file of walk(root)) {
    const lines = (await readFile(file, "utf8")).split("\n");
    lines.forEach((line, index) => {
      const match = line.match(pattern);
      if (match) violations.push(`${relative(".", file)}:${index + 1}  ${match[1]}`);
    });
  }
}

if (violations.length > 0) {
  console.error("Banned signing/sending APIs found (Nero is read-only, see ADR 0004):");
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}
