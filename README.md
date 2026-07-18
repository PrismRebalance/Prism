<div align="center">

# Prism

**Drift-aware portfolio rebalancer for Robinhood accounts.**
Prism tracks allocation drift, prices the cost of correcting it, and produces a rebalance plan that is meant to be executable, not just mathematically tidy.

[![Build](https://img.shields.io/github/actions/workflow/status/PrismRebalance/Prism/ci.yml?branch=master&style=flat-square&label=Build)](https://github.com/PrismRebalance/Prism/actions)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
[![Built with Claude Agent SDK](https://img.shields.io/badge/Built%20with-Claude%20Agent%20SDK-6366f1?style=flat-square)](https://docs.anthropic.com/en/docs/agents-and-tools/claude-agent-sdk)

</div>

---

Most portfolio tools stop at visibility. They show the account, maybe the percentages, and then leave the operator alone with the hard question: is the drift big enough to fix, and if so, are the trades still worth doing after spreads, minimum size, transaction fees, and cash reserve constraints are counted honestly?

Prism is built for that decision. It treats rebalancing like an execution problem, not a math exercise.

`LOAD ACCOUNT -> MEASURE DRIFT -> BUILD PLAN -> PREFLIGHT -> EXECUTE OR HOLD`

---

Why Prism Exists • Portfolio Policy • At a Glance • Decision Stack • What A Rebalance Must Prove • Example Output • Default Sleeve Design • Risk Controls • Quick Start

## Why Prism Exists

Rebalancing sounds easy when the portfolio is hypothetical. It becomes harder the moment the account is real.

One asset runs too far, another becomes too small, and the target allocation now conflicts with spreads, minimum trade sizes, price impact, and the need to keep enough cash in reserve. That is the gap Prism is meant to fill.

It is not a passive tracker and it is not a blind auto-trader. It is a portfolio policy engine for operators who want a disciplined way to decide whether drift is worth correcting right now.

## Portfolio Policy, Not Just Portfolio Tracking

The value of Prism is not that it knows the account composition. Plenty of tools can show that.

The value is that it asks the right question after composition changes:

- is the portfolio still inside policy
- if not, which drift matters first
- what trades would fix it
- which of those trades still make sense after execution quality and cash reserve safety are checked

That framing makes the product much easier to understand for non-dev readers too. The job is not "portfolio visualization." The job is "keep the account close to plan without paying stupid friction."

## At a Glance

- `Use case`: keeping a Robinhood account close to a target allocation without manual spreadsheet work
- `Primary input`: account balances, asset prices, target percentages, execution quality, and trading friction
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

Every trade is tested against execution quality, trade size, price impact, and cash reserve constraints.

### 5. Final State

The output is either executable, preview-only, or skipped.

That final distinction is why Prism reads like a real allocator instead of a toy optimizer.

## How It Works

Prism follows a five-part loop:

1. load current Robinhood account balances and price them in USD
2. compare the live portfolio against the configured target allocation
3. compute drift for every tracked asset and rank the deviations
4. build rebalance orders that move the portfolio back toward target
5. preflight the candidate orders for execution quality, price impact, minimum size, and cash reserve safety

Only the orders that survive preflight should be treated as real. Everything else is analysis, not permission.

## What A Rebalance Must Prove

A good Prism plan is not just one that improves the percentages. It has to prove four things:

- the drift is large enough to matter
- the correction is large enough to justify trading
- the execution quality is strong enough to preserve the edge
- the account keeps its configured cash reserve after the trades clear

This is what makes Prism more appealing for launch than a generic "rebalance bot" description. The pitch is immediately grounded in constraints people already understand.

## What Prism Does On Purpose

- promotes a small number of meaningful corrections over many tiny trades
- protects reserve balance instead of over-optimizing every percentage point
- demotes trades whose execution quality is too weak to justify execution
- leaves a plan in preview when the drift is real but the trade quality is weak

That behavior is important. A rebalancer that is always eager to trade is usually just good at generating fees.

## Example Output

```text
PRISM // REBALANCE PLAN

account value       $12,440
largest drift       BTC +8.2%
mode                preview

1. sell BTC -> buy USDC    $620   execute
2. sell XRP -> buy ETH     $180   execute
3. buy DOGE using USDC      $95   hold: below min trade
```

## Default Sleeve Design

| Asset | Target | Role in the portfolio |
|-------|--------|-----------------------|
| BTC | 40% | core allocation |
| ETH | 15% | large-cap crypto |
| DOGE | 15% | high-beta sleeve |
| XRP | 10% | payments sleeve |
| AVAX | 10% | smart-contract sleeve |
| USDC | 10% | cash reserve |

The target mix is configurable. Prism measures every holding against the chosen weights on each cycle.

## When Prism Should Hold Fire

There are plenty of cases where the right answer is no trade.

- the drift is real but too small to justify friction
- the intended correction would breach the cash reserve floor
- the execution quality is too weak for the size involved
- the order improves percentages but not enough to matter economically

This is a big part of the product story. People trust allocator tools more when they can see that restraint is part of the design.

## Risk Controls

- `rebalance threshold`: ignores small drift that is not worth paying to correct
- `minimum trade size`: stops dust-level corrections from cluttering the plan
- `price impact cap`: marks expensive trades as non-executable
- `cash reserve floor`: keeps the configured minimum cash balance in the account
- `preview mode`: lets operators inspect the plan before allowing execution

Prism should be trusted as a disciplined allocator, not as a license to overtrade the account every time prices move.

## Support Docs

- [Live board](https://prism-launch.vercel.app/)
- [Rebalance filters](docs/rebalance-filters.md)
- [Prism on X](https://x.com/PrismRobinhood)
- [$PRISM launch](https://pons.family/)

## License

MIT

---

*keep the portfolio close to target without pretending friction does not exist.*
