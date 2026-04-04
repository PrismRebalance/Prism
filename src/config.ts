import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

const schema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1),
  HELIUS_API_KEY: z.string().min(1),
  WALLET_ADDRESS: z.string().min(32),
  CLAUDE_MODEL: z.string().default("claude-sonnet-4-6"),
  REBALANCE_THRESHOLD_PCT: z.coerce.number().default(5),
  MIN_TRADE_USD: z.coerce.number().default(50),
  DRY_RUN: z.string().default("true"),
  CHECK_INTERVAL_MS: z.coerce.number().default(3_600_000),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Config error:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export const HELIUS_BASE = "https://api.helius.xyz/v0";
export const JUPITER_PRICE = "https://api.jup.ag/price/v2";
export const JUPITER_QUOTE = "https://quote-api.jup.ag/v6";
