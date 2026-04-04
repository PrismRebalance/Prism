import type { Portfolio, TokenBalance } from "./types.js";
import { config, HELIUS_BASE, JUPITER_PRICE } from "./config.js";

interface HeliusToken {
  mint: string;
  amount: number;
  decimals: number;
  tokenAccount: string;
}

interface JupiterPrice {
  id: string;
  mintSymbol: string;
  price: number;
}

const SYMBOL_MAP: Record<string, string> = {
  "So11111111111111111111111111111111111111112":  "SOL",
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN": "JUP",
  "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL": "JTO",
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": "BONK",
  "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm": "WIF",
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": "USDC",
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So": "mSOL",
  "7Q2afV64in6N6SeZsAAB81TJzwDoD6zpqmHkzi9Dcavn": "JSOL",
};

export async function fetchPortfolio(wallet: string): Promise<Portfolio> {
  // Fetch token balances via Helius
  const balRes = await fetch(`${HELIUS_BASE}/addresses/${wallet}/balances?api-key=${config.HELIUS_API_KEY}`);
  if (!balRes.ok) throw new Error(`Helius balances ${balRes.status}`);
  const balData = await balRes.json() as { nativeBalance: number; tokens: HeliusToken[] };

  // Fetch prices via Jupiter
  const allMints = [
    "So11111111111111111111111111111111111111112",
    ...balData.tokens.map((t) => t.mint),
  ].join(",");

  const priceRes = await fetch(`${JUPITER_PRICE}?ids=${allMints}`);
  const priceData = await priceRes.json() as { data: Record<string, JupiterPrice> };
  const prices = priceData.data ?? {};

  const tokens: TokenBalance[] = [];

  // Native SOL
  const solPrice = prices["So11111111111111111111111111111111111111112"]?.price ?? 0;
  const solAmount = balData.nativeBalance / 1e9;
  if (solAmount > 0.001) {
    tokens.push({
      mint: "So11111111111111111111111111111111111111112",
      symbol: "SOL",
      amount: solAmount,
      decimals: 9,
      priceUsd: solPrice,
      valueUsd: solAmount * solPrice,
    });
  }

  // SPL tokens
  for (const t of balData.tokens) {
    const symbol = SYMBOL_MAP[t.mint] ?? t.mint.slice(0, 6);
    const price = prices[t.mint]?.price ?? 0;
    const amount = t.amount / Math.pow(10, t.decimals);
    const valueUsd = amount * price;
    if (valueUsd < 1) continue;

    tokens.push({ mint: t.mint, symbol, amount, decimals: t.decimals, priceUsd: price, valueUsd });
  }

  const totalValueUsd = tokens.reduce((s, t) => s + t.valueUsd, 0);
  return { wallet, totalValueUsd, tokens, updatedAt: Date.now() };
}
