// The play/pause channel. The plugin hooks write one word to the state file:
//   "playing" while Claude Code is generating, "paused" when it has finished.
// Real-time games (snake) only advance while playing; turn-based games are
// always playable but show the current Claude status.
//
// The path is per-tmux-session: ensure-pane.sh passes it via CLAUDE_ARCADE_STATE
// so two concurrent Claude sessions don't share one play/pause flag. Falls back
// to the global path when launched standalone.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { STATE_DIR } from "./config.ts";

const STATE_FILE = process.env.CLAUDE_ARCADE_STATE ?? join(STATE_DIR, "state");

export function isClaudeWorking(): boolean {
  try {
    return readFileSync(STATE_FILE, "utf8").trim() === "playing";
  } catch {
    return false;
  }
}
