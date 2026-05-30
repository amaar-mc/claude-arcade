// Claude Arcade — the launcher loop that runs in the right-hand tmux pane.
// Cycles between games, shows a menu and a live settings screen, and drives
// each game's input/advance. Real-time games advance only while Claude is
// working; turn-based games are always playable.
//
//   bun arcade/arcade.ts

import { isClaudeWorking } from "./state.ts";
import { loadConfig, saveConfig, type ArcadeConfig } from "./config.ts";
import {
  BOLD,
  DIM,
  FG,
  HIDE_CURSOR,
  RESET,
  SHOW_CURSOR,
  CLEAR_SCREEN,
  center,
  color,
  paint,
} from "./render.ts";
import type { GameModule, RunningGame, View } from "./types.ts";
import { module as snake } from "./games/snake.ts";
import { module as tictactoe } from "./games/tictactoe.ts";
import { module as connectfour } from "./games/connectfour.ts";
import { module as twenty48 } from "./games/twenty48.ts";
import { module as chess } from "./games/chess.ts";

const GAMES: readonly GameModule[] = [snake, tictactoe, connectfour, twenty48, chess];
const FRAME_MS = 60;

type Screen = "menu" | "play" | "settings";

function rng(): number {
  return Math.random();
}

function indexOfGame(id: string): number {
  const i = GAMES.findIndex((g) => g.id === id);
  return i >= 0 ? i : 0;
}

// Park the arcade pane in a detached window (state kept alive) so `Alt-j` can
// re-attach it. No-op outside tmux.
function hidePane(): void {
  const pane = process.env.TMUX_PANE;
  if (pane === undefined || pane === "") return;
  Bun.spawn({ cmd: ["tmux", "break-pane", "-d", "-s", pane], stdout: "ignore", stderr: "ignore" });
}

function main(): void {
  let config: ArcadeConfig = loadConfig();
  let screen: Screen = "menu";
  let prevScreen: Screen = "menu";
  let current = indexOfGame(config.defaultGame);
  let menuSel = current;
  let settingsSel = 0;
  let running: RunningGame | null = null;
  let lastTick = Date.now();

  const out = process.stdout;
  out.write(CLEAR_SCREEN + HIDE_CURSOR);

  function view(): View {
    return { cols: out.columns ?? config.paneWidth, rows: out.rows ?? 24 };
  }

  function startGame(index: number): void {
    current = index;
    menuSel = index;
    running = GAMES[index].create(rng, config as unknown as Record<string, unknown>);
    lastTick = Date.now();
    screen = "play";
  }

  function cycleGame(delta: number): void {
    startGame((current + delta + GAMES.length) % GAMES.length);
  }

  // ---- settings fields --------------------------------------------------
  type Field = { label: string; value: () => string; adjust: (dir: number) => void };

  function clampAdjust(v: number, d: number, step: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v + d * step));
  }

  const fields: Field[] = [
    {
      label: "Default game",
      value: () => GAMES[indexOfGame(config.defaultGame)].name,
      adjust: (d) => {
        config.defaultGame = GAMES[(indexOfGame(config.defaultGame) + d + GAMES.length) % GAMES.length].id;
      },
    },
    {
      label: "Snake speed",
      value: () => `${config.snake.tickMs} ms${config.snake.tickMs <= 70 ? " (fast)" : config.snake.tickMs >= 200 ? " (slow)" : ""}`,
      adjust: (d) => {
        config.snake.tickMs = clampAdjust(config.snake.tickMs, -d, 10, 40, 400);
      },
    },
    {
      label: "Snake wrap walls",
      value: () => (config.snake.wrap ? "on" : "off"),
      adjust: () => {
        config.snake.wrap = !config.snake.wrap;
      },
    },
    {
      label: "Connect Four depth",
      value: () => String(config.connectFour.aiDepth),
      adjust: (d) => {
        config.connectFour.aiDepth = clampAdjust(config.connectFour.aiDepth, d, 1, 1, 8);
      },
    },
    {
      label: "Chess depth",
      value: () => String(config.chess.aiDepth),
      adjust: (d) => {
        config.chess.aiDepth = clampAdjust(config.chess.aiDepth, d, 1, 1, 4);
      },
    },
    {
      label: "Auto-focus panes",
      value: () => (config.autoFocus ? "on" : "off"),
      adjust: () => {
        config.autoFocus = !config.autoFocus;
      },
    },
  ];

  function openSettings(): void {
    prevScreen = screen === "settings" ? prevScreen : screen;
    screen = "settings";
    settingsSel = 0;
  }

  // ---- input ------------------------------------------------------------
  function onData(key: string): void {
    if (key === "\x03") return cleanup(); // Ctrl-C: hard exit
    if (key === "j" || key === "J") return hidePane();
    if (key === "\t") return cycleGame(1);
    if (key === "c" || key === "C") {
      if (screen === "settings") {
        screen = prevScreen; // keep in-memory config; it was already saved on each change
      } else openSettings();
      return;
    }

    if (screen === "settings") return settingsKey(key);

    if (key === "m" || key === "M" || key === "\x1b") {
      screen = "menu";
      return;
    }

    if (screen === "menu") return menuKey(key);

    if (running !== null) running.onKey(key);
  }

  function settingsKey(key: string): void {
    if (key === "\x1b[A" || key === "w") settingsSel = (settingsSel - 1 + fields.length) % fields.length;
    else if (key === "\x1b[B" || key === "s") settingsSel = (settingsSel + 1) % fields.length;
    else if (key === "\x1b[D" || key === "a") {
      fields[settingsSel].adjust(-1);
      saveConfig(config);
    } else if (key === "\x1b[C" || key === "d") {
      fields[settingsSel].adjust(1);
      saveConfig(config);
    } else if (key === "\r" || key === " ") {
      screen = prevScreen;
    }
  }

  function menuKey(key: string): void {
    if (key >= "1" && key <= String(GAMES.length)) return startGame(Number(key) - 1);
    if (key === "\x1b[A" || key === "w") menuSel = (menuSel - 1 + GAMES.length) % GAMES.length;
    else if (key === "\x1b[B" || key === "s") menuSel = (menuSel + 1) % GAMES.length;
    else if (key === "\r" || key === " ") startGame(menuSel);
  }

  // ---- frame composition -----------------------------------------------
  function claudeBadge(): string {
    return isClaudeWorking()
      ? color("● Claude working", FG.green)
      : color("○ Claude idle", FG.gray);
  }

  function vcenter(block: string[], v: View): string[] {
    const pad = Math.max(0, Math.floor((v.rows - block.length) / 2));
    return [...Array.from({ length: pad }, () => ""), ...block];
  }

  function buildMenu(v: View): string[] {
    const lines: string[] = [];
    lines.push(center(color(`${BOLD}▞▚ CLAUDE ARCADE ▚▞`, FG.magenta), v.cols));
    lines.push(center(color("play while Claude works", DIM), v.cols));
    lines.push("");
    GAMES.forEach((g, i) => {
      const selected = i === menuSel;
      const marker = selected ? color("▸", FG.yellow) : " ";
      const name = selected ? color(`${BOLD}${g.name}`, FG.white) : color(g.name, FG.gray);
      lines.push(center(`${marker} ${color(String(i + 1), FG.cyan)} ${name}`, v.cols));
    });
    lines.push("");
    lines.push(center(color(GAMES[menuSel].blurb, DIM), v.cols)); // fixed line — no vertical jump
    lines.push("");
    lines.push(center(claudeBadge(), v.cols));
    lines.push("");
    lines.push(center(color("↑↓ select · enter play · c settings · j hide", DIM), v.cols));
    return vcenter(lines, v);
  }

  function buildSettings(v: View): string[] {
    const lines: string[] = [];
    lines.push(center(color(`${BOLD}▞▚ SETTINGS ▚▞`, FG.cyan), v.cols));
    lines.push("");
    fields.forEach((f, i) => {
      const selected = i === settingsSel;
      const marker = selected ? color("▸", FG.yellow) : " ";
      const label = `${f.label}`.padEnd(20);
      const val = selected ? color(`‹ ${f.value()} ›`, FG.yellow) : color(f.value(), FG.gray);
      const text = `${marker} ${selected ? color(label, FG.white) : color(label, FG.gray)}${val}`;
      lines.push(center(text, v.cols));
    });
    lines.push("");
    lines.push(center(color("paneWidth applies next session · changes auto-save", DIM), v.cols));
    lines.push(center(color("↑↓ field · ←/→ change · enter/esc back", DIM), v.cols));
    return vcenter(lines, v);
  }

  function buildPlay(v: View): string[] {
    if (running === null) return buildMenu(v);
    const mod = GAMES[current];
    const drawn = running.draw(v);
    const lines: string[] = [];
    lines.push(center(`${color(BOLD + mod.name, FG.magenta)}  ${claudeBadge()}`, v.cols));
    lines.push("");
    for (const gl of drawn.lines) lines.push(center(gl, v.cols));
    lines.push("");
    if (mod.realtime && !isClaudeWorking() && !running.isOver()) {
      lines.push(center(color("|| PAUSED — prompt Claude to play", FG.yellow), v.cols));
    } else {
      lines.push(center(drawn.status, v.cols));
    }
    lines.push("");
    lines.push(center(color(drawn.help, DIM), v.cols));
    lines.push(center(color("tab next · m menu · c settings · j hide", DIM), v.cols));
    return vcenter(lines, v);
  }

  function frame(): void {
    const v = view();
    if (screen === "play" && running !== null) {
      const mod = GAMES[current];
      if (mod.realtime && isClaudeWorking() && !running.isOver()) {
        const now = Date.now();
        if (now - lastTick >= config.snake.tickMs) {
          running.tick();
          lastTick = now;
        }
      }
    }
    const lines = screen === "menu" ? buildMenu(v) : screen === "settings" ? buildSettings(v) : buildPlay(v);
    const next = paint(lines, v);
    if (next !== lastPainted) {
      out.write(next);
      lastPainted = next;
    }
  }

  // ---- lifecycle --------------------------------------------------------
  let loop: ReturnType<typeof setInterval> | null = null;
  let lastPainted = "";

  function cleanup(): void {
    if (loop !== null) clearInterval(loop);
    out.write(SHOW_CURSOR + RESET + "\n");
    try {
      process.stdin.setRawMode(false);
    } catch {
      /* not a TTY */
    }
    process.exit(0);
  }

  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk: string) => onData(chunk));
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  loop = setInterval(frame, FRAME_MS);
}

main();
