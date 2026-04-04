import type { TargetAllocation } from "./types.js";

// Default balanced Solana ecosystem portfolio
export const DEFAULT_TARGETS: TargetAllocation[] = [
  { symbol: "SOL",  mint: "So11111111111111111111111111111111111111112",  targetPct: 40 },
  { symbol: "JUP",  mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", targetPct: 15 },
  { symbol: "JTO",  mint: "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL", targetPct: 15 },
  { symbol: "BONK", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", targetPct: 10 },
  { symbol: "WIF",  mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", targetPct: 10 },
  { symbol: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", targetPct: 10 },
];

let activeTargets = [...DEFAULT_TARGETS];

export function getTargets(): TargetAllocation[] {
  return activeTargets;
}

export function setTargets(targets: TargetAllocation[]): void {
  const total = targets.reduce((s, t) => s + t.targetPct, 0);
  if (Math.abs(total - 100) > 0.01) throw new Error(`Targets must sum to 100%, got ${total}%`);
  activeTargets = targets;
}

export function findTarget(symbol: string): TargetAllocation | undefined {
  return activeTargets.find((t) => t.symbol.toUpperCase() === symbol.toUpperCase());
}
