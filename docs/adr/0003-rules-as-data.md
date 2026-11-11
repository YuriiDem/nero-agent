# 0003. Risk rules are data

- Status: accepted
- Date: 2026-11-11

## Context

Risk logic changes often and must be reviewable by people who don't read TypeScript. Rules written as code invite
side effects, hidden I/O and untestable branches.

## Decision

Rules are YAML files in `rules/` (`common/`, `evm/`, `solana/`), validated by a schema and evaluated by a pure
function in `packages/core`. Rules can only compare normalized facts with a fixed set of operators; they cannot
execute code, make requests or reference other files. Every rule ships with at least one fixture and a test. The rule
set has a version (`rulesVersion`) that is recorded in every verdict. When sources disagree, the worse value wins and
both facts are kept as evidence.

## Consequences

- Adding a risk is a reviewable YAML diff plus a fixture.
- The operator set is deliberately small; expanding it requires an ADR.
- Verdicts can be traced back to the exact rules version that produced them.
