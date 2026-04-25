<div align="center">

# Prism

**Drift-aware portfolio rebalancer for Solana wallets.**
Prism tracks allocation drift, prices the cost of correcting it, and produces a rebalance plan that is meant to be executable, not just mathematically tidy.

[![Build](https://img.shields.io/github/actions/workflow/status/PrismRebalance/Prism/ci.yml?branch=master&style=flat-square&label=Build)](https://github.com/PrismRebalance/Prism/actions)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
[![Built with Claude Agent SDK](https://img.shields.io/badge/Built%20with-Claude%20Agent%20SDK-6366f1?style=flat-square)](https://docs.anthropic.com/en/docs/agents-and-tools/claude-agent-sdk)

</div>

---

Most portfolio tools stop at visibility. They show the wallet, maybe the percentages, and then leave the operator alone with the hard question: is the drift big enough to fix, and if so, are the trades still worth doing after slippage, minimum size, and reserve constraints are counted honestly?

Prism is built for that decision. It treats rebalancing like an execution problem, not a math exercise.

`LOAD WALLET -> MEASURE DRIFT -> BUILD PLAN -> PREFLIGHT -> EXECUTE OR HOLD`

---

Why Prism Exists • Portfolio Policy • At a Glance • Decision Stack • What A Rebalance Must Prove • Example Output • Default Sleeve Design • Risk Controls • Quick Start

## Why Prism Exists

Rebalancing sounds easy when the portfolio is hypothetical. It becomes harder the moment the wallet is real.

One asset runs too far, another becomes too small, the neat target allocation you wanted now conflicts with price impact, dust thresholds, and the need to keep enough SOL to operate. That is the gap Prism is meant to fill.

It is not a passive tracker and it is not a blind auto-trader. It is a portfolio policy engine for operators who want a disciplined way to decide whether drift is worth correcting right now.

## Portfolio Policy, Not Just Portfolio Tracking

The value of Prism is not that it knows the wallet composition. Plenty of tools can show that.

The value is that it asks the right question after composition changes:

- is the portfolio still inside policy
- if not, which drift matters first
- what trades would fix it
- which of those trades still make sense after route quality and reserve safety are checked

That framing makes the product much easier to understand for non-dev readers too. The job is not "portfolio visualization." The job is "keep the wallet close to plan without paying stupid friction."

## At a Glance

- `Use case`: keeping a Solana wallet close to a target allocation without manual spreadsheet work
- `Primary input`: wallet balances, token prices, target percentages, quote quality, and execution friction
- `Primary failure mode`: generating mathematically correct rebalances that are not actually worth executing
- `Best for`: operators who want discipline around allocation drift, not just portfolio visibility

## The Decision Stack

Prism is intentionally opinionated about how a rebalance gets approved.

### 1. Portfolio Drift

The engine starts by measuring how far each tracked sleeve moved from target.

### 2. Priority

It then ranks the deviations so obvious overweights and underweights are handled before cosmetic ones.

### 3. Trade Construction

The planner turns that ranked drift into concrete buy and sell legs.

### 4. Preflight

Every trade is tested against route quality, trade size, and reserve constraints.

### 5. Final State

The output is either executable, preview-only, or skipped.

That final distinction is why Prism reads like a real allocator instead of a toy optimizer.

## How It Works

Prism follows a five-part loop:

1. load current wallet balances and price them in USD
2. compare the live portfolio against the configured target allocation
3. compute drift for every tracked asset and rank the deviations
4. build rebalance orders that move the portfolio back toward target
5. preflight the candidate orders for price impact, minimum size, and SOL reserve safety

Only the orders that survive preflight should be treated as real. Everything else is analysis, not permission.

## What A Rebalance Must Prove

A good Prism plan is not just one that improves the percentages. It has to prove four things:

- the drift is large enough to matter
- the correction is large enough to justify trading
- the route quality is good enough to avoid burning edge in execution
- the wallet will still be operational after the trades clear

This is what makes Prism more appealing for launch than a generic "rebalance bot" description. The pitch is immediately grounded in constraints people already understand.

## What Prism Does On Purpose

- promotes a small number of meaningful corrections over many tiny trades
- protects reserve balance instead of over-optimizing every percentage point
- demotes routes that look too expensive to justify execution
- leaves a plan in preview when the drift is real but the trade quality is weak

That behavior is important. A rebalancer that is always eager to trade is usually just good at generating fees.

## Example Output

```text
PRISM // REBALANCE PLAN

wallet value        $12,440
largest drift       SOL +8.2%
mode                dry-run

1. sell SOL -> buy USDC   $620   executable
2. sell BONK -> buy JTO   $180   executable
3. buy JUP using USDC      $95   skipped: below min trade
```

## Default Sleeve Design

| Token | Target | Role in the portfolio |
|-------|--------|-----------------------|
| SOL | 40% | core Solana exposure |
| JUP | 15% | DEX infrastructure |
| JTO | 15% | liquid staking |
| BONK | 10% | community beta |
| WIF | 10% | meme sleeve |
| USDC | 10% | reserve and dry powder |

Customize the target mix in [`src/targets.ts`](src/targets.ts).

## When Prism Should Hold Fire

There are plenty of cases where the right answer is no trade.

- the drift is real but too small to justify friction
- the intended correction would leave too little SOL in reserve
- the route quality is too weak for the size involved
- the order improves percentages but not enough to matter economically

This is a big part of the product story. People trust allocator tools more when they can see that restraint is part of the design.

## Risk Controls

- `rebalance threshold`: ignores small drift that is not worth paying to correct
- `minimum trade size`: stops dust-level corrections from cluttering the plan
- `price impact cap`: marks expensive routes as non-executable
- `SOL reserve floor`: protects the wallet from rebalancing away too much operating balance
- `dry-run mode`: lets operators inspect the plan before allowing execution

Prism should be trusted as a disciplined allocator, not as a license to overtrade the wallet every time prices move.

## Quick Start

```bash
git clone https://github.com/PrismRebalance/Prism
cd Prism
bun install
cp .env.example .env
bun run dev
```

## Configuration

```bash
ANTHROPIC_API_KEY=sk-ant-...
HELIUS_API_KEY=...
WALLET_ADDRESS=your-wallet
REBALANCE_THRESHOLD_PCT=5
MIN_TRADE_USD=50
MAX_PRICE_IMPACT_PCT=1.5
MIN_SOL_RESERVE=0.1
DRY_RUN=true
CHECK_INTERVAL_MS=3600000
```

## Support Docs

- [Runbook](docs/runbook.md)
- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## License

MIT

---

*keep the portfolio close to target without pretending friction does not exist.*
