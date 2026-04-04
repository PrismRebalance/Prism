import { describe, it, expect } from "vitest";
import type { Portfolio, TargetAllocation } from "../src/types.js";

function makePortfolio(tokens: Array<{ symbol: string; mint: string; valueUsd: number }>): Portfolio {
  const total = tokens.reduce((s, t) => s + t.valueUsd, 0);
  return {
    wallet: "TestWallet1234567890abcdefgh",
    totalValueUsd: total,
    tokens: tokens.map((t) => ({
      mint: t.mint,
      symbol: t.symbol,
      amount: t.valueUsd / 100,
      decimals: 9,
      priceUsd: 100,
      valueUsd: t.valueUsd,
    })),
    updatedAt: Date.now(),
  };
}

const targets: TargetAllocation[] = [
  { symbol: "SOL",  mint: "So11111111111111111111111111111111111111112",  targetPct: 50 },
  { symbol: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", targetPct: 50 },
];

describe("drift computation", () => {
  it("computes zero drift when perfectly balanced", async () => {
    const { computeDrift } = await import("../src/rebalancer.js");
    const portfolio = makePortfolio([
      { symbol: "SOL",  mint: "So11111111111111111111111111111111111111112",  valueUsd: 500 },
      { symbol: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", valueUsd: 500 },
    ]);
    const drifts = computeDrift(portfolio, targets);
    const sol = drifts.find((d) => d.symbol === "SOL");
    expect(Math.abs(sol?.driftPct ?? 99)).toBeLessThan(0.1);
  });

  it("detects overweight token", async () => {
    const { computeDrift } = await import("../src/rebalancer.js");
    const portfolio = makePortfolio([
      { symbol: "SOL",  mint: "So11111111111111111111111111111111111111112",  valueUsd: 800 },
      { symbol: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", valueUsd: 200 },
    ]);
    const drifts = computeDrift(portfolio, targets);
    const sol = drifts.find((d) => d.symbol === "SOL");
    expect(sol?.action).toBe("sell");
    expect(sol?.driftPct).toBeGreaterThan(0);
  });

  it("detects underweight token", async () => {
    const { computeDrift } = await import("../src/rebalancer.js");
    const portfolio = makePortfolio([
      { symbol: "SOL",  mint: "So11111111111111111111111111111111111111112",  valueUsd: 900 },
      { symbol: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", valueUsd: 100 },
    ]);
    const drifts = computeDrift(portfolio, targets);
    const usdc = drifts.find((d) => d.symbol === "USDC");
    expect(usdc?.action).toBe("buy");
  });
});

describe("target validation", () => {
  it("default targets sum to 100", async () => {
    const { DEFAULT_TARGETS } = await import("../src/targets.js");
    const sum = DEFAULT_TARGETS.reduce((s, t) => s + t.targetPct, 0);
    expect(sum).toBeCloseTo(100, 1);
  });

  it("throws when targets do not sum to 100", async () => {
    const { setTargets } = await import("../src/targets.js");
    expect(() => setTargets([
      { symbol: "SOL", mint: "abc", targetPct: 60 },
      { symbol: "USDC", mint: "def", targetPct: 60 },
    ])).toThrow();
  });
});
