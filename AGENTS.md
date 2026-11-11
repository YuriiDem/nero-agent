# AGENTS.md

Rules for AI coding agents (and humans) working on Nero Agent. `CLAUDE.md` points here.

## What Nero is

A local-first, read-only AI agent for crypto safety. It checks tokens, addresses and wallets for scam risks, shows a
portfolio across exchanges and wallets, and explains risks in plain language. It runs as a terminal app.

## Hard rules (never break these)

1. **Read-only.** Nero never signs or sends transactions and never stores private keys or seed phrases. Never add a
   signing, key-derivation or seed library. Banned imports are enforced by Biome, dependency-cruiser and
   `scripts/check-banned-apis.mjs`. Never weaken these checks to make code pass.
2. **Facts and risks only.** No buy/sell advice, no price predictions, no promises, in code, prompts or docs.
3. **The LLM narrates, rules judge.** Risk verdicts come only from the deterministic rule engine. The LLM explains
   findings that already exist and never creates, removes or changes a verdict.
4. **Honest uncertainty.** There is no "safe" level. Levels: `critical`, `high`, `medium`, `no_known_risks`,
   `insufficient_data`. Missing critical facts mean `insufficient_data`. When sources disagree, the worse value wins.
5. **Local-first and private.** No telemetry, no analytics. User data goes only to providers the user configured.
6. **Bring your own keys.** API keys live only in the OS keychain, never in config files, logs or test fixtures.
   Everything must work on free tiers and with local models.

## Architecture boundaries (enforced by `pnpm boundaries`)

- `packages/core`: domain and use cases. No I/O, no Node APIs (`fs`, `path`, `process`, `node:*`), no imports from
  other workspace packages. Only `zod` is allowed from npm. Must stay portable to a browser or a MetaMask Snap.
- `packages/providers`: one folder per external service (client + mapper + fixtures + tests). Depends only on
  `core/ports` and `core/shared`. Raw API shapes never leave the provider; it maps them to normalized `Fact[]`.
- `packages/runtime`: composition root. Wires providers into ports and owns config, keychain and the HTTP client.
- `apps/cli`: Ink TUI. Depends on `runtime` and may import **types only** from `core`. It consumes the
  `AsyncIterable<NeroEvent>` stream and knows nothing about internals.
- `rules/`: YAML risk rules are data, never code. Every rule ships with a fixture and a test.

## Working agreement

- The lead engineer owns architecture and product decisions. Propose options (2–3, with pros, cons and a
  recommendation) and wait for a decision. Do not change course silently; stop and ask.
- One milestone at a time, plan first. One branch per milestone (`m1-core-domain`, ...) with a PR for review. Never
  push to `main` directly.
- Before integrating an external API, read its current official docs and verify endpoints, auth and rate limits.
  Never guess request or response shapes. Record real responses as fixtures.
- Before adding a dependency, verify its current stable version and justify it. Keep dependencies minimal. Install
  scripts are blocked (`allowBuilds` in `pnpm-workspace.yaml`); adding a package to the allowlist needs a reason in
  the PR.
- Commit messages and PR descriptions carry no AI-tool attribution.
- Before finishing, `pnpm check` (lint, typecheck, test, boundaries) must pass.

## Code style

- TypeScript strict, no `any`, named exports only, kebab-case file names.
- Small focused files, one use case per file, co-located tests (`*.test.ts`).
- Unit tests never hit the network. Live tests are `*.live.test.ts`, opt-in, and need real keys.
- Minimal comments: name things well and comment only a non-obvious "why".
- Everything in English. Conventional Commits. Update `CHANGELOG.md` for each milestone.

## Commands

```bash
pnpm install       # install (build scripts blocked unless allowlisted)
pnpm check         # lint + typecheck + test + boundaries
pnpm lint          # biome check + banned API scan
pnpm format        # biome format --write
pnpm typecheck     # tsc -b
pnpm test          # vitest run
pnpm boundaries    # dependency-cruiser architecture rules
```
