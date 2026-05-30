// Tic-tac-toe vs. a perfect minimax engine. You are X (first), the engine is O.
// Pure logic (winner/minimax/bestMove) is exported for tests.

import type { Drawn, GameConfig, GameModule, RNG, RunningGame, View } from "../types.ts";
import { BOLD, DIM, FG, INVERSE, RESET, center, color } from "../render.ts";

export type Mark = "X" | "O" | null;
export type TttBoard = readonly Mark[]; // length 9, row-major
export type Outcome = "X" | "O" | "draw" | null;

const LINES: readonly [number, number, number][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function winner(board: TttBoard): Outcome {
  for (const [a, b, c] of LINES) {
    if (board[a] !== null && board[a] === board[b] && board[b] === board[c]) {
      return board[a];
    }
  }
  return board.every((m) => m !== null) ? "draw" : null;
}

function other(player: "X" | "O"): "X" | "O" {
  return player === "X" ? "O" : "X";
}

// Negamax-style minimax from O's perspective. Depth bonus makes the engine win
// as fast as possible and lose as slowly as possible.
export function minimax(board: TttBoard, player: "X" | "O", depth: number): number {
  const w = winner(board);
  if (w === "O") return 10 - depth;
  if (w === "X") return depth - 10;
  if (w === "draw") return 0;

  const scores: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      const next = board.slice();
      next[i] = player;
      scores.push(minimax(next, other(player), depth + 1));
    }
  }
  return player === "O" ? Math.max(...scores) : Math.min(...scores);
}

export function bestMove(board: TttBoard, player: "X" | "O"): number {
  let bestIdx = -1;
  let bestScore = player === "O" ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      const next = board.slice();
      next[i] = player;
      const score = minimax(next, other(player), 1);
      if ((player === "O" && score > bestScore) || (player === "X" && score < bestScore)) {
        bestScore = score;
        bestIdx = i;
      }
    }
  }
  return bestIdx;
}

function glyph(mark: Mark): string {
  if (mark === "X") return color("X", FG.cyan);
  if (mark === "O") return color("O", FG.magenta);
  return color("·", FG.gray);
}

function draw(board: TttBoard, cursor: number, result: Outcome): Drawn {
  const width = 13;
  const lines: string[] = [color("┌───┬───┬───┐", FG.gray)];
  for (let r = 0; r < 3; r++) {
    let row = color("│", FG.gray);
    for (let c = 0; c < 3; c++) {
      const i = r * 3 + c;
      const cell = ` ${glyph(board[i])} `;
      row += (i === cursor && result === null ? `${INVERSE}${cell}${RESET}` : cell) + color("│", FG.gray);
    }
    lines.push(row);
    lines.push(color(r < 2 ? "├───┼───┼───┤" : "└───┴───┴───┘", FG.gray));
  }

  let status: string;
  if (result === "X") status = color(`${BOLD}YOU WIN!`, FG.green);
  else if (result === "O") status = color(`${BOLD}ENGINE WINS`, FG.red);
  else if (result === "draw") status = color(`${BOLD}DRAW`, FG.yellow);
  else status = `${color("your move", FG.cyan)}${color(" (X)", DIM)}`;

  return {
    lines: lines.map((l) => center(l, width)),
    status,
    help: "arrows move  ·  enter place  ·  r restart",
  };
}

export const module: GameModule = {
  id: "tictactoe",
  name: "Tic-Tac-Toe",
  blurb: "Beat (or draw) a flawless engine. You're X.",
  realtime: false,
  tickMs: 0,
  create(_rng: RNG, _cfg: GameConfig): RunningGame {
    let board: Mark[] = Array.from({ length: 9 }, () => null);
    let cursor = 4;
    let result: Outcome = null;

    function place(index: number): void {
      if (result !== null || board[index] !== null) return;
      board[index] = "X";
      result = winner(board);
      if (result !== null) return;
      const ai = bestMove(board, "O");
      if (ai >= 0) board[ai] = "O";
      result = winner(board);
    }

    function reset(): void {
      board = Array.from({ length: 9 }, () => null);
      cursor = 4;
      result = null;
    }

    return {
      onKey(key: string): void {
        if (key === "r" || key === "R") return reset();
        if (key >= "1" && key <= "9") return place(Number(key) - 1);
        const row = Math.floor(cursor / 3);
        const col = cursor % 3;
        if ((key === "\x1b[A" || key === "w") && row > 0) cursor -= 3;
        else if ((key === "\x1b[B" || key === "s") && row < 2) cursor += 3;
        else if ((key === "\x1b[D" || key === "a") && col > 0) cursor -= 1;
        else if ((key === "\x1b[C" || key === "d") && col < 2) cursor += 1;
        else if (key === "\r" || key === " ") place(cursor);
      },
      tick(): void {},
      draw(_view: View): Drawn {
        return draw(board, cursor, result);
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
