// Connect Four vs. an alpha-beta engine. You are Red and move first; the engine
// is Yellow. Pure logic (drop/winner/evaluate/bestColumn) is exported for tests.

import type { Drawn, GameConfig, GameModule, RNG, RunningGame, View } from "../types.ts";
import { BOLD, FG, RESET, color, padTo } from "../render.ts";

export type Disc = "R" | "Y" | null;
export type C4Board = readonly (readonly Disc[])[]; // [row][col], row 0 = top
export type C4Result = "R" | "Y" | "draw" | null;

export const ROWS = 6;
export const COLS = 7;
const ORDER = [3, 2, 4, 1, 5, 0, 6]; // center-first for better pruning

export function emptyBoard(): C4Board {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null as Disc));
}

export function drop(board: C4Board, col: number, player: "R" | "Y"): C4Board | null {
  if (col < 0 || col >= COLS || board[0][col] !== null) return null;
  let row = ROWS - 1;
  while (row >= 0 && board[row][col] !== null) row -= 1;
  return board.map((r, ri) => r.map((c, ci) => (ri === row && ci === col ? player : c)));
}

function fourFrom(board: C4Board, r: number, c: number, dr: number, dc: number): Disc {
  const first = board[r][c];
  if (first === null) return null;
  for (let k = 1; k < 4; k++) {
    const nr = r + dr * k;
    const nc = c + dc * k;
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== first) return null;
  }
  return first;
}

export function winner(board: C4Board): C4Result {
  const dirs: [number, number][] = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of dirs) {
        const w = fourFrom(board, r, c, dr, dc);
        if (w !== null) return w;
      }
    }
  }
  return board[0].every((c) => c !== null) ? "draw" : null;
}

function scoreWindow(cells: readonly Disc[]): number {
  const y = cells.filter((c) => c === "Y").length;
  const r = cells.filter((c) => c === "R").length;
  if (y > 0 && r > 0) return 0; // mixed window, dead
  if (y === 3) return 50;
  if (y === 2) return 10;
  if (y === 1) return 1;
  if (r === 3) return -80; // weight blocking the opponent slightly higher
  if (r === 2) return -10;
  if (r === 1) return -1;
  return 0;
}

// Heuristic from Yellow's (engine's) perspective.
export function evaluate(board: C4Board): number {
  let score = 0;
  for (let r = 0; r < ROWS; r++) score += board[r][3] === "Y" ? 6 : board[r][3] === "R" ? -6 : 0;
  const collect = (r: number, c: number, dr: number, dc: number): Disc[] =>
    [0, 1, 2, 3].map((k) => board[r + dr * k][c + dc * k]);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c <= COLS - 4; c++) score += scoreWindow(collect(r, c, 0, 1));
  for (let r = 0; r <= ROWS - 4; r++) for (let c = 0; c < COLS; c++) score += scoreWindow(collect(r, c, 1, 0));
  for (let r = 0; r <= ROWS - 4; r++) for (let c = 0; c <= COLS - 4; c++) score += scoreWindow(collect(r, c, 1, 1));
  for (let r = 0; r <= ROWS - 4; r++) for (let c = 3; c < COLS; c++) score += scoreWindow(collect(r, c, 1, -1));
  return score;
}

function negamax(board: C4Board, depth: number, alpha: number, beta: number, player: "R" | "Y"): number {
  const w = winner(board);
  if (w === "Y") return 100000 + depth;
  if (w === "R") return -100000 - depth;
  if (w === "draw") return 0;
  if (depth === 0) return evaluate(board);

  let a = alpha;
  let b = beta;
  if (player === "Y") {
    let best = -Infinity;
    for (const col of ORDER) {
      const next = drop(board, col, "Y");
      if (next === null) continue;
      best = Math.max(best, negamax(next, depth - 1, a, b, "R"));
      a = Math.max(a, best);
      if (a >= b) break;
    }
    return best;
  }
  let best = Infinity;
  for (const col of ORDER) {
    const next = drop(board, col, "R");
    if (next === null) continue;
    best = Math.min(best, negamax(next, depth - 1, a, b, "Y"));
    b = Math.min(b, best);
    if (a >= b) break;
  }
  return best;
}

export function bestColumn(board: C4Board, depth: number, player: "R" | "Y"): number {
  let bestCol = ORDER.find((c) => board[0][c] === null) ?? -1;
  let bestScore = player === "Y" ? -Infinity : Infinity;
  for (const col of ORDER) {
    const next = drop(board, col, player);
    if (next === null) continue;
    const score = negamax(next, depth - 1, -Infinity, Infinity, player === "Y" ? "R" : "Y");
    if ((player === "Y" && score > bestScore) || (player === "R" && score < bestScore)) {
      bestScore = score;
      bestCol = col;
    }
  }
  return bestCol;
}

function disc(d: Disc): string {
  if (d === "R") return color("●", FG.red);
  if (d === "Y") return color("●", FG.yellow);
  return color("·", FG.gray);
}

function draw(board: C4Board, sel: number, result: C4Result): Drawn {
  const width = COLS * 2 + 2;
  // Leading space accounts for the left border column so the ▼ sits over its disc.
  let ind = " ";
  for (let c = 0; c < COLS; c++) ind += (c === sel && result === null ? color("▼", FG.red) : " ") + " ";
  const lines: string[] = [ind];
  lines.push(color(`╭${"─".repeat(COLS * 2)}╮`, FG.blue));
  for (let r = 0; r < ROWS; r++) {
    let row = color("│", FG.blue);
    for (let c = 0; c < COLS; c++) row += disc(board[r][c]) + " ";
    lines.push(row + color("│", FG.blue));
  }
  lines.push(color(`╰${"─".repeat(COLS * 2)}╯`, FG.blue));
  lines.push(color(" 1 2 3 4 5 6 7", FG.gray));

  let status: string;
  if (result === "R") status = color(`${BOLD}YOU WIN!`, FG.green);
  else if (result === "Y") status = color(`${BOLD}ENGINE WINS`, FG.red);
  else if (result === "draw") status = color(`${BOLD}DRAW`, FG.yellow);
  else status = `${color("your move", FG.red)}${RESET}`;

  return {
    // Pad every line to the same width so the arcade centers them as one block
    // (lines differ in length — uneven centering would misalign labels).
    lines: lines.map((l) => padTo(l, width)),
    status,
    help: "←/→ pick column  ·  enter drop  ·  1-7  ·  r restart",
  };
}

export const module: GameModule = {
  id: "connectfour",
  name: "Connect Four",
  blurb: "Stack four in a row before the engine does. You're red.",
  realtime: false,
  tickMs: 0,
  create(_rng: RNG, cfg: GameConfig): RunningGame {
    const c4 = (cfg.connectFour ?? {}) as { aiDepth?: number };
    const depth = typeof c4.aiDepth === "number" ? c4.aiDepth : 5;
    let board = emptyBoard();
    let sel = 3;
    let result: C4Result = null;

    function play(col: number): void {
      if (result !== null) return;
      const afterPlayer = drop(board, col, "R");
      if (afterPlayer === null) return;
      board = afterPlayer;
      result = winner(board);
      if (result !== null) return;
      const aiCol = bestColumn(board, depth, "Y");
      const afterAi = drop(board, aiCol, "Y");
      if (afterAi !== null) board = afterAi;
      result = winner(board);
    }

    function reset(): void {
      board = emptyBoard();
      sel = 3;
      result = null;
    }

    return {
      onKey(key: string): void {
        if (key === "r" || key === "R") return reset();
        if (key >= "1" && key <= "7") return play(Number(key) - 1);
        if ((key === "\x1b[D" || key === "a") && sel > 0) sel -= 1;
        else if ((key === "\x1b[C" || key === "d") && sel < COLS - 1) sel += 1;
        else if (key === "\r" || key === " " || key === "\x1b[B" || key === "s") play(sel);
      },
      tick(): void {},
      draw(_view: View): Drawn {
        return draw(board, sel, result);
      },
      isOver(): boolean {
        return result !== null;
      },
      restart(): void {
        reset();
      },
    };
  },
};
