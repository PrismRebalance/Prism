import type { RebalanceOrder } from "./types.js";
import { config, JUPITER_QUOTE } from "./config.js";
import { log } from "./logger.js";

interface JupiterQuote {
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  routePlan: unknown[];
}

export async function getQuote(
  inputMint: string,
  outputMint: string,
  amountLamports: number
): Promise<JupiterQuote | null> {
  const url = `${JUPITER_QUOTE}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=50`;
  const res = await fetch(url);
  if (!res.ok) { log.warn(`Jupiter quote failed: ${res.status}`); return null; }
  return await res.json() as JupiterQuote;
}

export async function executeOrder(order: RebalanceOrder): Promise<boolean> {
  if (config.DRY_RUN === "true") {
    log.info(`[DRY RUN] Would swap $${order.amountUsd} ${order.fromToken} → ${order.toToken}`);
    return true;
  }

  // In live mode: get quote → build swap tx → sign → send
  // Requires wallet keypair — not included in this template
  log.warn("Live execution requires WALLET_PRIVATE_KEY — set DRY_RUN=false only with a funded keypair");
  return false;
}

export function printOrders(orders: RebalanceOrder[]): void {
  const BOLD = "\x1b[1m";
  const RESET = "\x1b[0m";
  const GREEN = "\x1b[32m";
  const RED = "\x1b[31m";
  const bar = "─".repeat(64);

  console.log(`\n${bar}`);
  console.log(`  ${BOLD}PRISM — REBALANCE ORDERS${RESET}  (${orders.length})`);
  console.log(bar);

  for (const o of orders) {
    const dir = `${RED}${o.fromToken}${RESET} → ${GREEN}${o.toToken}${RESET}`;
    console.log(`\n  ${BOLD}#${o.priority}${RESET}  ${dir}  $${o.amountUsd.toLocaleString()}`);
    console.log(`     ${o.rationale}`);
  }
  console.log(`\n${bar}\n`);
}
