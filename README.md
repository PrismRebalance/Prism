<div align="center">

# Prism

**Portfolio rebalancer for Solana.**
Set your target allocation. Prism watches your wallet, detects drift, and proposes (or executes) the exact trades to restore balance.

[![Build](https://img.shields.io/github/actions/workflow/status/PrismRebalance/Prism/ci.yml?branch=main&style=flat-square&label=Build)](https://github.com/PrismRebalance/Prism/actions)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
[![Built with Claude Agent SDK](https://img.shields.io/badge/Built%20with-Claude%20Agent%20SDK-6366f1?style=flat-square)](https://docs.anthropic.com/en/docs/agents-and-tools/claude-agent-sdk)

</div>

---

Your portfolio drifts. SOL pumps 30%, now it's 55% of your bag when you wanted 40%. You meant to rebalance but never did. Prism does it for you.

Set your target allocations once. Prism checks your wallet every hour, computes drift per token, and when anything exceeds the threshold it asks Claude to generate a prioritized trade plan. In dry-run mode it shows you the trades. In live mode it executes them via Jupiter.

```
FETCH → COMPUTE DRIFT → PLAN TRADES → EXECUTE (or preview)
```

---

## Portfolio Dashboard

![Prism Allocation](assets/preview-allocation.svg)

---

## Rebalance Plan

![Prism Rebalance](assets/preview-rebalance.svg)

---

## Default Target Allocation

| Token | Target | Notes |
|-------|--------|-------|
| SOL | 40% | Core Solana ecosystem |
| JUP | 15% | DEX infrastructure |
| JTO | 15% | Liquid staking |
| BONK | 10% | Community token |
| WIF | 10% | Memecoin exposure |
| USDC | 10% | Stable buffer |

Customize in `src/targets.ts`.

---

## Quick Start

```bash
git clone https://github.com/PrismRebalance/Prism
cd Prism && bun install
cp .env.example .env
# set WALLET_ADDRESS, HELIUS_API_KEY, ANTHROPIC_API_KEY
bun run dev
```

---

## Configuration

```bash
WALLET_ADDRESS=your-wallet
REBALANCE_THRESHOLD_PCT=5   # rebalance when drift > 5%
MIN_TRADE_USD=50             # skip tiny drifts
DRY_RUN=true                 # preview trades without executing
CHECK_INTERVAL_MS=3600000    # hourly
```

---

## License

MIT

---

*set it. forget it. stay balanced.*
