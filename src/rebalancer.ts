import type { Portfolio, AllocationDrift } from "./types.js";
import type { TargetAllocation } from "./types.js";
import { config } from "./config.js";

export function computeDrift(portfolio: Portfolio, targets: TargetAllocation[]): AllocationDrift[] {
  const drifts: AllocationDrift[] = [];
  const allSymbols = new Set([
    ...portfolio.tokens.map((t) => t.symbol),
    ...targets.map((t) => t.symbol),
  ]);

  for (const symbol of allSymbols) {
    const token = portfolio.tokens.find((t) => t.symbol === symbol);
    const target = targets.find((t) => t.symbol === symbol);

    const currentPct = token ? (token.valueUsd / portfolio.totalValueUsd) * 100 : 0;
    const targetPct = target?.targetPct ?? 0;
    const driftPct = currentPct - targetPct;
    const driftUsd = (driftPct / 100) * portfolio.totalValueUsd;

    drifts.push({
      symbol,
      mint: token?.mint ?? target?.mint ?? "",
      currentPct: Math.round(currentPct * 100) / 100,
      targetPct,
      driftPct: Math.round(driftPct * 100) / 100,
      driftUsd: Math.round(driftUsd * 100) / 100,
      action: Math.abs(driftPct) < 0.5 ? "hold" : driftPct > 0 ? "sell" : "buy",
    });
  }

  return drifts.sort((a, b) => Math.abs(b.driftPct) - Math.abs(a.driftPct));
}

export function needsRebalance(drifts: AllocationDrift[]): boolean {
  return drifts.some(
    (d) => Math.abs(d.driftPct) >= config.REBALANCE_THRESHOLD_PCT && Math.abs(d.driftUsd) >= config.MIN_TRADE_USD
  );
}

export function getActionable(drifts: AllocationDrift[]): AllocationDrift[] {
  return drifts.filter(
    (d) => d.action !== "hold" &&
      Math.abs(d.driftPct) >= config.REBALANCE_THRESHOLD_PCT &&
      Math.abs(d.driftUsd) >= config.MIN_TRADE_USD
  );
}
