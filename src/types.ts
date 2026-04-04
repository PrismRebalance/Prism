export interface TokenBalance {
  mint: string;
  symbol: string;
  amount: number;
  decimals: number;
  priceUsd: number;
  valueUsd: number;
}

export interface Portfolio {
  wallet: string;
  totalValueUsd: number;
  tokens: TokenBalance[];
  updatedAt: number;
}

export interface TargetAllocation {
  symbol: string;
  mint: string;
  targetPct: number;
}

export interface AllocationDrift {
  symbol: string;
  mint: string;
  currentPct: number;
  targetPct: number;
  driftPct: number;
  driftUsd: number;
  action: "buy" | "sell" | "hold";
}

export interface RebalanceOrder {
  id: string;
  fromToken: string;
  toToken: string;
  fromMint: string;
  toMint: string;
  amountUsd: number;
  rationale: string;
  priority: number;
  generatedAt: number;
}
