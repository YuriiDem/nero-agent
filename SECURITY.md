# Security Policy

> **Nero has no token.** Any token, coin, NFT or airdrop using the Nero name is a scam.

## Reporting a vulnerability

Report vulnerabilities privately through GitHub: **Security → Report a vulnerability** on this repository. Do not
open public issues for security problems.

Include the affected version or commit, steps to reproduce, and the expected impact.

We aim to acknowledge reports within 3 business days and to share an assessment within 10 business days. Reporters
are credited in the release notes unless they prefer otherwise.

## Scope

In scope:

- Anything that could make Nero sign, send or broadcast a transaction, or handle a private key or seed phrase.
- Leaks of API keys, wallet addresses or other user data to anyone other than the providers the user configured.
- Prompt injection or crafted on-chain data that changes a risk verdict or makes Nero present a risky asset as safe.
- Supply-chain issues in Nero's dependencies or release process.

Out of scope: vulnerabilities in third-party data providers themselves, and the accuracy of their data.

## Design guarantees

- Read-only: no signing or key-handling code, enforced by lint and dependency rules.
- No telemetry or analytics.
- API keys are stored only in the OS keychain.

## Supported versions

Until v1.0.0 only the latest `main` is supported. After that, only the latest minor release receives fixes.
