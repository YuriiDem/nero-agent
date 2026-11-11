# 0002. The LLM narrates, rules judge

- Status: accepted
- Date: 2026-11-11

## Context

LLMs are non-deterministic, can be steered by prompt injection hidden in token names or metadata, and tend to
reassure. A wrong "looks safe" can cost a user their funds.

## Decision

Risk verdicts are produced only by a deterministic, pure rule engine: `(facts, rules) => findings`, then aggregated
into a `Verdict` with coverage. Levels are `critical`, `high`, `medium`, `no_known_risks` and `insufficient_data`.
There is no "safe" level, and missing critical facts yield `insufficient_data`.

The LLM receives existing findings and only explains them, using structured output (`{ summary, findingIds }`). A
narration guard rejects output that omits critical findings or calls a risky asset safe; Nero then falls back to a
templated explanation. Untrusted strings reach the model only inside marked, truncated data blocks.

## Consequences

- Verdicts are reproducible and testable with fixtures, and evals can assert that injection never changes them.
- Nero works without any model (offline mode with templated text).
- New risk detection means new rules and facts, never prompt changes.
