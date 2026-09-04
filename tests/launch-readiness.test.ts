import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const avatar = readFileSync(new URL("../assets/prism-avatar.png", import.meta.url));
const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { description?: string; homepage?: string; keywords?: string[] };

describe("Robinhood and Pons launch presentation", () => {
  it("positions Prism as a Robinhood rebalancer launching on Pons", () => {
    expect(readme).toContain("portfolio rebalancer for Robinhood accounts");
    expect(readme).toContain('<img src="assets/prism-avatar.png"');
    expect(avatar.byteLength).toBeGreaterThan(1_024);
    expect(readme).toContain("[Launch venue](https://pons.family/)");
    expect(readme).not.toMatch(/vercel\.app|\bSolana\b|Pump\.fun|Polymarket/i);
    expect(packageJson.description).toContain("Robinhood rebalancer");
    expect(packageJson.homepage).toBe("https://pons.family/");
    expect(packageJson.keywords).toContain("robinhood");
    expect(packageJson.keywords).toContain("pons");
  });
});
