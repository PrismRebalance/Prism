import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();


const TEST_ENV = process.env.NODE_ENV === "test" || process.env.VITEST === "true";

const schema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1),
  HELIUS_API_KEY: z.string().min(1),
  WALLET_ADDRESS: z.string().min(32),
  CLAUDE_MODEL: z.string().default("claude-sonnet-4-6"),
  REBALANCE_THRESHOLD_PCT: z.coerce.number().default(5),
  MIN_TRADE_USD: z.coerce.number().default(50),
  MAX_PRICE_IMPACT_PCT: z.coerce.number().default(1.5),
  MIN_SOL_RESERVE: z.coerce.number().default(0.1),
  DRY_RUN: z.string().default("true"),
  WALLET_PRIVATE_KEY: z.string().optional(),
  CHECK_INTERVAL_MS: z.coerce.number().default(3_600_000),
});

const env = TEST_ENV
  ? {
      ANTHROPIC_API_KEY: "test-anthropic-key",
      HELIUS_API_KEY: "test-helius-key",
      WALLET_ADDRESS: "TestWallet111111111111111111111111111111",
      ...process.env,
    }
  : process.env;
const parsed = schema.safeParse(env);
if (!parsed.success) {
  console.error("Config error:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export const HELIUS_BASE = "https://api.helius.xyz/v0";
export const JUPITER_PRICE = "https://api.jup.ag/price/v2";
export const JUPITER_QUOTE = "https://quote-api.jup.ag/v6";
