# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- M0: repository bootstrap. pnpm workspace (`core`, `providers`, `runtime`, `cli`), strict TypeScript, Biome,
  Vitest, dependency-cruiser architecture boundaries, banned signer API checks, CI, `AGENTS.md`, `SECURITY.md`,
  and ADRs 0001–0004.
- M1: core domain in `@nero-agent/core`.
  - Shared types (`Chain`, `Subject`, `Fact`, `Finding`, `Coverage`, `Verdict`) and a typed fact catalog with
    "worse value wins" comparators.
  - Ports: `EvidenceSource`, `BalanceSource`, `PriceFeed`, `LlmGateway`, `SecretStore`, `ConfigStore`, `Clock`.
  - Rule engine: zod-validated rule schema, rule-set loader, three-valued (true/false/unknown) evaluator, so missing
    facts never count as "no risk".
  - Verdict aggregation with coverage and a `complete` flag.
  - Guards: seed phrase / private key detector, untrusted-text sanitizer, spoof-proof data blocks, narration guard.
  - `NeroEvent` types for the CLI event stream.
  - Core subpath exports `./shared` and `./ports`; providers may import only those.
- M2: CLI shell. `nero` starts an Ink TUI.
  - Placeholder half-block pixel mascot with idle (blink) and thinking frames.
  - Status header, scrolling transcript and input box with cursor editing.
  - Slash commands `/help`, `/clear`, `/exit` with Tab completion and typo suggestions.
  - Rendering of the `NeroEvent` stream.
  - `nero --help` and `nero --version`. `NO_COLOR` is respected.
- M2: seed phrases and private keys are blocked on paste and on submit; they are never echoed, stored or sent.
- M2: runtime session seam (no-model stub reply), config in `~/.nero/config.json` (strict schema, atomic owner-only
  writes, `NERO_HOME` override), and OS keychain secret store via `@napi-rs/keyring`.
- M1: runtime YAML rule loader (aliases, duplicate keys and unknown tags rejected) and a fixture harness that
  requires every rule in `rules/` to ship with a `.fixture.yaml`.
