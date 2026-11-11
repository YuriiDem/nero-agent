# Nero

A local-first, read-only AI agent for your terminal that checks crypto tokens, addresses and wallets for scam risks and
explains them in plain language.

<!-- Terminal demo GIF goes here. -->

## What it does

- Checks tokens on EVM chains and Solana for honeypots, mint/freeze authority, owner privileges, taxes, liquidity and
  holder concentration.
- Checks addresses against known malicious and drainer lists.
- Shows your portfolio across wallets (Ethereum, Base, Arbitrum, BNB Chain, Solana) and Binance (read-only key).
- Explains every finding with a link to its source, and shows how many sources it could reach.

## Principles

- **Read-only.** Never signs or sends transactions; never stores keys or seed phrases.
- **Facts and risks only.** No buy/sell advice, no price predictions.
- **Rules judge, the LLM narrates.** Verdicts come from deterministic rules; there is no "safe" verdict.
- **Local-first.** No telemetry. Data goes only to the providers you configure.
- **Bring your own keys.** Your API keys and your model, including local ones.

## Install and quick start

Not released yet. Planned for v1.0.0:

```bash
npm install -g nero-agent
nero
nero check <address> --chain ethereum
```

## Configuration

Planned for v1.0.0: API keys are stored in your OS keychain (`/login <provider>`). The model is chosen with `/model`
(Anthropic, OpenAI, Google, OpenRouter, or any OpenAI-compatible endpoint such as Ollama or LM Studio). Settings live
in `~/.nero/`.

## Status and roadmap

Pre-alpha. Current milestone: M0 (repository bootstrap).

- M1: core domain and rule engine
- M2: CLI shell
- M3: LLM layer
- M4: wallets and portfolio
- M5: token and address checks
- M6: hardening and v1.0.0

## Security and license

Nero has no token; any token using its name is a scam. See [SECURITY.md](SECURITY.md) to report a vulnerability.

[MIT](LICENSE)
