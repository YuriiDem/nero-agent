# 0004. No runtime third-party code, read-only by construction

- Status: accepted
- Date: 2026-11-11

## Context

A crypto safety tool is an attractive supply-chain target. Plugins, remote rule code or install scripts would let
third parties run code next to users' wallet data. A read-only promise kept only in prompts or docs is not a
guarantee.

## Decision

- Nero never loads or executes code at runtime that did not ship in the package: no plugins, no `eval`, no remotely
  fetched scripts, no code in rules (see 0003).
- Dependencies are minimal and justified, pinned exactly, and installed from a committed lockfile. Dependency
  install scripts are blocked by default (`allowBuilds` in `pnpm-workspace.yaml`, `strictDepBuilds: true`).
- Read-only is enforced by tooling: Biome `noRestrictedImports` and dependency-cruiser `no-signers` ban signing,
  key-derivation and seed libraries (`viem/accounts`, `ethers`, `@solana/web3.js`, `tweetnacl`, `bip39`, `@scure/bip32`,
  `@scure/bip39`, `@noble/curves`, ...). `scripts/check-banned-apis.mjs` bans signing and sending identifiers such as
  `privateKeyToAccount`, `signTransaction` and `eth_sendRawTransaction` in source.

## Consequences

- Extensibility comes from YAML rules and new provider adapters merged into the repo, not from plugins.
- Some convenient libraries are off-limits. For example, Solana address validation must use a minimal base58 library
  rather than `@solana/web3.js`.
- A future feature that needs a banned identifier (such as decoding signature requests) requires a new ADR and a
  narrow, reviewed allowlist entry.
