// Arcade configuration: loaded from ~/.claude-arcade/config.json, seeded from
// config.default.json on first run. Unknown/invalid fields fall back to defaults
// so a hand-edited file can never crash the game.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type ArcadeConfig = {
  defaultGame: string;
  paneWidth: number;
  autoFocus: boolean;
  snake: { tickMs: number; wrap: boolean };
  connectFour: { aiDepth: number };
  chess: { aiDepth: number };
};

export const STATE_DIR = join(homedir(), ".claude-arcade");
export const CONFIG_FILE = join(STATE_DIR, "config.json");
export const STATE_FILE = join(STATE_DIR, "state");

export const DEFAULT_CONFIG: ArcadeConfig = {
  defaultGame: "snake",
  paneWidth: 52,
  autoFocus: true,
  snake: { tickMs: 120, wrap: false },
  connectFour: { aiDepth: 5 },
  chess: { aiDepth: 2 },
};

function int(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(min, Math.min(max, Math.floor(value)));
  }
  return fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

export function normalize(raw: Record<string, unknown>): ArcadeConfig {
  const snake = (raw.snake ?? {}) as Record<string, unknown>;
  const c4 = (raw.connectFour ?? {}) as Record<string, unknown>;
  const chess = (raw.chess ?? {}) as Record<string, unknown>;
  return {
    defaultGame: str(raw.defaultGame, DEFAULT_CONFIG.defaultGame),
    paneWidth: int(raw.paneWidth, DEFAULT_CONFIG.paneWidth, 30, 200),
    autoFocus: bool(raw.autoFocus, DEFAULT_CONFIG.autoFocus),
    snake: {
      tickMs: int(snake.tickMs, DEFAULT_CONFIG.snake.tickMs, 40, 1000),
      wrap: bool(snake.wrap, DEFAULT_CONFIG.snake.wrap),
    },
    connectFour: {
      aiDepth: int(c4.aiDepth, DEFAULT_CONFIG.connectFour.aiDepth, 1, 8),
    },
    chess: {
      aiDepth: int(chess.aiDepth, DEFAULT_CONFIG.chess.aiDepth, 1, 4),
    },
  };
}

export function loadConfig(): ArcadeConfig {
  try {
    return normalize(JSON.parse(readFileSync(CONFIG_FILE, "utf8")) as Record<string, unknown>);
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: ArcadeConfig): void {
  try {
    mkdirSync(STATE_DIR, { recursive: true });
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + "\n", "utf8");
  } catch {
    /* read-only home or similar — keep playing with in-memory config */
  }
}
