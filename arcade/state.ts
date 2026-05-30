// The play/pause channel. The plugin hooks write one word to the state file:
//   "playing" while Claude Code is generating, "paused" when it has finished.
// Real-time games (snake) only advance while playing; turn-based games are
// always playable but show the current Claude status.

import { readFileSync } from "node:fs";
import { STATE_FILE } from "./config.ts";

export function isClaudeWorking(): boolean {
  try {
    return readFileSync(STATE_FILE, "utf8").trim() === "playing";
  } catch {
    return false;
  }
}
