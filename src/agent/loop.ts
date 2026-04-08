import Anthropic from "@anthropic-ai/sdk";
import type { Portfolio, AllocationDrift, RebalanceOrder } from "../types.js";
import { PRISM_SYSTEM } from "./prompts.js";
import { config } from "../config.js";
import { log } from "../logger.js";
import { getQuote } from "../executor.js";
import crypto from "crypto";

const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

const tools: Anthropic.Tool[] = [
  {
    name: "get_portfolio_snapshot",
    description: "Current portfolio: all token balances, prices, and USD values",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_allocation_drift",
    description: "Current vs target allocation for each token; shows what is overweight and underweight",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_actionable_drifts",
    description: "Only tokens that exceed the rebalance threshold and minimum trade size",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "propose_trade",
    description: "Propose a specific rebalance trade",
    input_schema: {
      type: "object" as const,
      properties: {
        from_token: { type: "string" },
        to_token: { type: "string" },
        from_mint: { type: "string" },
        to_mint: { type: "string" },
        amount_usd: { type: "number" },
        rationale: { type: "string" },
        priority: { type: "number" },
      },
      required: ["from_token", "to_token", "from_mint", "to_mint", "amount_usd", "rationale", "priority"],
    },
  },
];

export async function runPrismAgent(
  portfolio: Portfolio,
  drifts: AllocationDrift[],
  actionable: AllocationDrift[]
): Promise<RebalanceOrder[]> {
  const orders: RebalanceOrder[] = [];

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Portfolio value: $${portfolio.totalValueUsd.toLocaleString()}. ${actionable.length} tokens need rebalancing. Analyze and propose trades.`,
    },
  ];

  for (let turn = 0; turn < 12; turn++) {
    const response = await client.messages.create({
      model: config.CLAUDE_MODEL,
      max_tokens: 3000,
      system: PRISM_SYSTEM,
      tools,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });
    if (response.stop_reason !== "tool_use") break;

    const results: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const input = block.input as Record<string, unknown>;
      let result = "";

      if (block.name === "get_portfolio_snapshot") {
        result = JSON.stringify({
          wallet: portfolio.wallet.slice(0, 12) + "...",
          totalUsd: `$${portfolio.totalValueUsd.toLocaleString()}`,
          tokens: portfolio.tokens.map((token) => ({
            symbol: token.symbol,
            amount: token.amount.toFixed(4),
            price: `$${token.priceUsd.toFixed(4)}`,
            value: `$${token.valueUsd.toFixed(2)}`,
            pct: `${((token.valueUsd / portfolio.totalValueUsd) * 100).toFixed(1)}%`,
          })),
        });
      } else if (block.name === "get_allocation_drift") {
        result = JSON.stringify(drifts.map((drift) => ({
          symbol: drift.symbol,
          current: `${drift.currentPct}%`,
          target: `${drift.targetPct}%`,
          drift: `${drift.driftPct > 0 ? "+" : ""}${drift.driftPct}%`,
          driftUsd: `$${Math.abs(drift.driftUsd).toFixed(0)}`,
          action: drift.action,
        })));
      } else if (block.name === "get_actionable_drifts") {
        result = JSON.stringify(actionable);
      } else if (block.name === "propose_trade") {
        const amountUsd = input.amount_usd as number;
        const fromToken = input.from_token as string;
        const toToken = input.to_token as string;
        const fromMint = input.from_mint as string;
        const toMint = input.to_mint as string;
        const sourceBalance = portfolio.tokens.find((token) => token.mint === fromMint);
        const usdCap =
          fromToken === "SOL" && sourceBalance
            ? Math.max(0, sourceBalance.valueUsd - sourceBalance.priceUsd * config.MIN_SOL_RESERVE)
            : sourceBalance?.valueUsd ?? amountUsd;
        const cappedUsd = Math.min(amountUsd, usdCap);
        const approximateInputAmount = sourceBalance && sourceBalance.priceUsd > 0
          ? Math.floor((cappedUsd / sourceBalance.priceUsd) * Math.pow(10, sourceBalance.decimals))
          : 0;
        const quote = approximateInputAmount > 0 ? await getQuote(fromMint, toMint, approximateInputAmount) : null;
        const priceImpactPct = quote?.priceImpactPct ?? 0;
        const executable =
          cappedUsd >= config.MIN_TRADE_USD &&
          priceImpactPct <= config.MAX_PRICE_IMPACT_PCT &&
          approximateInputAmount > 0;

        const order: RebalanceOrder = {
          id: crypto.randomUUID(),
          fromToken,
          toToken,
          fromMint,
          toMint,
          amountUsd: Number(cappedUsd.toFixed(2)),
          estimatedOutputUsd: Number(cappedUsd.toFixed(2)),
          priceImpactPct: Number(priceImpactPct.toFixed(2)),
          executable,
          skipReason: executable
            ? undefined
            : cappedUsd < config.MIN_TRADE_USD
              ? "below minimum trade after sizing"
              : approximateInputAmount <= 0
                ? "missing route sizing data"
                : `price impact ${priceImpactPct.toFixed(2)}% exceeds cap`,
          rationale: input.rationale as string,
          priority: input.priority as number,
          generatedAt: Date.now(),
        };
        orders.push(order);
        log.info(`Trade proposed: ${order.fromToken}->${order.toToken} $${order.amountUsd} impact=${order.priceImpactPct.toFixed(2)}% priority=${order.priority}`);
        result = JSON.stringify({ accepted: true, id: order.id });
      } else {
        result = JSON.stringify({ error: `Unknown tool: ${block.name}` });
      }

      results.push({ type: "tool_result", tool_use_id: block.id, content: result });
    }

    messages.push({ role: "user", content: results });
  }

  return orders.sort((left, right) => left.priority - right.priority);
}
