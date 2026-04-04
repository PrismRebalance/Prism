import Anthropic from "@anthropic-ai/sdk";
import type { Portfolio, AllocationDrift, RebalanceOrder } from "../types.js";
import { PRISM_SYSTEM } from "./prompts.js";
import { config } from "../config.js";
import { log } from "../logger.js";
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
    description: "Current vs target allocation for each token — shows what's overweight and underweight",
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
          wallet: portfolio.wallet.slice(0, 12) + "…",
          totalUsd: `$${portfolio.totalValueUsd.toLocaleString()}`,
          tokens: portfolio.tokens.map((t) => ({
            symbol: t.symbol,
            amount: t.amount.toFixed(4),
            price: `$${t.priceUsd.toFixed(4)}`,
            value: `$${t.valueUsd.toFixed(2)}`,
            pct: `${((t.valueUsd / portfolio.totalValueUsd) * 100).toFixed(1)}%`,
          })),
        });
      } else if (block.name === "get_allocation_drift") {
        result = JSON.stringify(drifts.map((d) => ({
          symbol: d.symbol,
          current: `${d.currentPct}%`,
          target: `${d.targetPct}%`,
          drift: `${d.driftPct > 0 ? "+" : ""}${d.driftPct}%`,
          driftUsd: `$${Math.abs(d.driftUsd).toFixed(0)}`,
          action: d.action,
        })));
      } else if (block.name === "get_actionable_drifts") {
        result = JSON.stringify(actionable);
      } else if (block.name === "propose_trade") {
        const order: RebalanceOrder = {
          id: crypto.randomUUID(),
          fromToken: input.from_token as string,
          toToken: input.to_token as string,
          fromMint: input.from_mint as string,
          toMint: input.to_mint as string,
          amountUsd: input.amount_usd as number,
          rationale: input.rationale as string,
          priority: input.priority as number,
          generatedAt: Date.now(),
        };
        orders.push(order);
        log.info(`Trade proposed: ${order.fromToken}→${order.toToken} $${order.amountUsd} priority=${order.priority}`);
        result = JSON.stringify({ accepted: true, id: order.id });
      }

      results.push({ type: "tool_result", tool_use_id: block.id, content: result });
    }

    messages.push({ role: "user", content: results });
  }

  return orders.sort((a, b) => a.priority - b.priority);
}
