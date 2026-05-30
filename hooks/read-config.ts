// Print a single top-level config value to stdout, or nothing if unavailable.
// Usage: bun read-config.ts <key>
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const key = process.argv[2] ?? "";
try {
  const cfg = JSON.parse(
    readFileSync(join(homedir(), ".claude-arcade", "config.json"), "utf8"),
  ) as Record<string, unknown>;
  const value = cfg[key];
  if (value !== undefined && value !== null) process.stdout.write(String(value));
} catch {
  /* no config yet — print nothing, caller uses its fallback */
}
