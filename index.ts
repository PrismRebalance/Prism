import { fetchPortfolio } from "./src/portfolio.js";
import { getTargets } from "./src/targets.js";
import { computeDrift, needsRebalance, getActionable } from "./src/rebalancer.js";
import { runPrismAgent } from "./src/agent/loop.js";
import { executeOrder, printOrders } from "./src/executor.js";
import { config } from "./src/config.js";
import { log } from "./src/logger.js";

async function check(): Promise<void> {
  log.info(`Checking portfolio: ${config.WALLET_ADDRESS.slice(0, 12)}…`);
  const portfolio = await fetchPortfolio(config.WALLET_ADDRESS);
  log.info(`Portfolio value: $${portfolio.totalValueUsd.toLocaleString()} · ${portfolio.tokens.length} tokens`);

  const targets = getTargets();
  const drifts = computeDrift(portfolio, targets);
  const actionable = getActionable(drifts);

  if (!needsRebalance(drifts)) {
    log.info("Portfolio is balanced — no action needed");
    return;
  }

  log.info(`${actionable.length} tokens exceed rebalance threshold`);
  const orders = await runPrismAgent(portfolio, drifts, actionable);

  printOrders(orders);

  if (config.DRY_RUN !== "true") {
    for (const order of orders) {
      await executeOrder(order);
    }
  } else {
    log.info("DRY_RUN=true — no trades executed");
  }
}

async function main(): Promise<void> {
  log.info("Prism v0.1.0 — portfolio rebalancer starting");
  log.info(`Threshold: ${config.REBALANCE_THRESHOLD_PCT}% · Min trade: $${config.MIN_TRADE_USD} · Dry run: ${config.DRY_RUN}`);

  await check();
  setInterval(() => check().catch((e) => log.error("Check error:", e)), config.CHECK_INTERVAL_MS);
}

main().catch((e) => { log.error("Fatal:", e); process.exit(1); });
