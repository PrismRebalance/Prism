import { fetchPortfolio } from "./src/portfolio.js";
import { getTargets } from "./src/targets.js";
import { computeDrift, needsRebalance, getActionable } from "./src/rebalancer.js";
import { runPrismAgent } from "./src/agent/loop.js";
import { executeOrder, printOrders } from "./src/executor.js";
import { config } from "./src/config.js";
import { log } from "./src/logger.js";

async function check(): Promise<void> {
  const startedAt = Date.now();

  try {
    log.info(`Checking portfolio: ${config.WALLET_ADDRESS.slice(0, 12)}...`);
    const portfolio = await fetchPortfolio(config.WALLET_ADDRESS);
    log.info(`Portfolio value: $${portfolio.totalValueUsd.toLocaleString()} | ${portfolio.tokens.length} tokens`);

    const targets = getTargets();
    const drifts = computeDrift(portfolio, targets);
    const actionable = getActionable(drifts);

    if (!needsRebalance(drifts)) {
      log.info("Portfolio is balanced - no action needed");
      return;
    }

    if (actionable.length === 0) {
      log.info("Rebalance threshold tripped, but no token passed the actionable filters");
      return;
    }

    log.info(`${actionable.length} tokens exceed rebalance threshold`);
    const orders = await runPrismAgent(portfolio, drifts, actionable);
    if (orders.length === 0) {
      log.info("Agent returned no executable rebalance orders");
      return;
    }

    printOrders(orders);

    if (config.DRY_RUN !== "true") {
      for (const order of orders) {
        try {
          await executeOrder(order);
        } catch (e) {
          log.error("Order execution failed", {
            market: order.market,
            side: order.side,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
    } else {
      log.info("DRY_RUN=true - no trades executed");
    }
  } finally {
    const durationMs = Date.now() - startedAt;
    log.info("Prism check complete", { durationMs });

    if (durationMs > config.CHECK_INTERVAL_MS) {
      log.warn("Prism check exceeded configured interval", {
        durationMs,
        intervalMs: config.CHECK_INTERVAL_MS,
      });
    }
  }
}

async function main(): Promise<void> {
  log.info("Prism v0.1.0 - portfolio rebalancer starting");
  log.info(
    `Threshold: ${config.REBALANCE_THRESHOLD_PCT}% | Min trade: $${config.MIN_TRADE_USD} | Dry run: ${config.DRY_RUN}`,
  );

  let checkInFlight = false;
  let skippedChecks = 0;

  const tick = async () => {
    if (checkInFlight) {
      skippedChecks++;
      log.warn("Skipping rebalance check because the previous cycle is still running", {
        skippedChecks,
      });
      return;
    }

    checkInFlight = true;
    try {
      await check();
    } catch (e) {
      log.error("Check error:", e);
    } finally {
      checkInFlight = false;
    }
  };

  await tick();
  setInterval(() => {
    void tick();
  }, config.CHECK_INTERVAL_MS);
}

main().catch((e) => {
  log.error("Fatal:", e);
  process.exit(1);
});
