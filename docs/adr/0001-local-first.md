# 0001. Local-first and private

- Status: accepted
- Date: 2026-11-11

## Context

Nero sees wallet addresses, balances and exchange holdings, all of which are sensitive. A hosted backend would hold
that data and become a target, a cost center and a point of trust that users cannot verify.

## Decision

Nero runs entirely on the user's machine. There is no Nero backend, no telemetry and no analytics. Data leaves the
machine only in requests to providers the user configured (data APIs and the chosen LLM). The user brings their own
API keys, which are stored in the OS keychain. Configuration is plain JSON in `~/.nero/`; v1 has no database.
User wallet addresses are masked before being sent to cloud LLMs (configurable).

## Consequences

- Nero must work on provider free tiers and with local models, so it degrades gracefully when a source is missing or
  rate-limited.
- We get no usage data. Feedback comes from issues and evals.
- Every new outbound call must target a user-configured provider; reviewers check this.
