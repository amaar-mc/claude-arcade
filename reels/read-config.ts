// Print a single reels.<field> config value to stdout, or nothing if unavailable.
// Usage: bun reels/read-config.ts <field>
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const field = process.argv[2] ?? "";
try {
  const cfg = JSON.parse(
    readFileSync(join(homedir(), ".claude-arcade", "config.json"), "utf8"),
  ) as { reels?: Record<string, unknown> };
  const value = cfg.reels?.[field];
  if (value !== undefined && value !== null) process.stdout.write(String(value));
} catch {
  /* no config yet - print nothing, caller uses its fallback */
}
