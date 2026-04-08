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
  if (!res.ok) {
    log.warn(`Jupiter quote failed: ${res.status}`);
    return null;
  }
  return await res.json() as JupiterQuote;
}

export async function executeOrder(order: RebalanceOrder): Promise<boolean> {
  if (config.DRY_RUN === "true") {
    log.info(`[DRY RUN] Would swap $${order.amountUsd} ${order.fromToken} -> ${order.toToken}`);
    return true;
  }

  if (!order.executable) {
    log.warn(`Skipping ${order.fromToken} -> ${order.toToken}: ${order.skipReason ?? "order not executable"}`);
    return false;
  }

  if (!config.WALLET_PRIVATE_KEY) {
    log.warn("Live execution requires WALLET_PRIVATE_KEY");
    return false;
  }

  // In live mode: get quote -> build swap tx -> sign -> send.
  // This scaffold stops at preflight validation until a signer is wired in.
  log.warn("Live execution hook not wired in this scaffold; preflight passed but no swap submitter is attached");
  return false;
}

export function printOrders(orders: RebalanceOrder[]): void {
  const BOLD = "\x1b[1m";
  const RESET = "\x1b[0m";
  const GREEN = "\x1b[32m";
  const RED = "\x1b[31m";
  const bar = "-".repeat(64);

  console.log(`\n${bar}`);
  console.log(`  ${BOLD}PRISM - REBALANCE ORDERS${RESET}  (${orders.length})`);
  console.log(bar);

  for (const order of orders) {
    const dir = `${RED}${order.fromToken}${RESET} -> ${GREEN}${order.toToken}${RESET}`;
    console.log(`\n  ${BOLD}#${order.priority}${RESET}  ${dir}  $${order.amountUsd.toLocaleString()}  impact=${order.priceImpactPct.toFixed(2)}%`);
    console.log(`     ${order.rationale}`);
    if (!order.executable) console.log(`     skipped: ${order.skipReason}`);
  }
  console.log(`\n${bar}\n`);
}
