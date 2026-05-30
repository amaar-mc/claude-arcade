// 2048. Slide tiles, merge equal numbers, reach 2048 (and keep going).
// Pure logic (slideLine/move/spawn/isOver) is exported for tests.

import type { Drawn, GameConfig, GameModule, RNG, RunningGame, View } from "../types.ts";
import { BOLD, FG, RESET, center, color } from "../render.ts";

export type Grid = readonly (readonly number[])[]; // 4x4, 0 = empty
export type Move = "up" | "down" | "left" | "right";
export const SIZE = 4;

export function emptyGrid(): number[][] {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0));
}

export function slideLine(line: readonly number[]): { line: number[]; gained: number } {
  const nums = line.filter((x) => x !== 0);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
      const merged = nums[i] * 2;
      out.push(merged);
      gained += merged;
      i += 1;
    } else {
      out.push(nums[i]);
    }
  }
  while (out.length < SIZE) out.push(0);
  return { line: out, gained };
}

function transpose(g: Grid): number[][] {
  return g[0].map((_, c) => g.map((row) => row[c]));
}

function reverseRows(g: Grid): number[][] {
  return g.map((row) => [...row].reverse());
}

export function move(grid: Grid, dir: Move): { grid: number[][]; gained: number; moved: boolean } {
  let work: number[][] = grid.map((row) => [...row]);
  if (dir === "right") work = reverseRows(work);
  else if (dir === "up") work = transpose(work);
  else if (dir === "down") work = reverseRows(transpose(work));

  let gained = 0;
  work = work.map((row) => {
    const res = slideLine(row);
    gained += res.gained;
    return res.line;
  });

  if (dir === "right") work = reverseRows(work);
  else if (dir === "up") work = transpose(work);
  else if (dir === "down") work = transpose(reverseRows(work));

  const moved = JSON.stringify(work) !== JSON.stringify(grid);
  return { grid: work, gained, moved };
}

export function emptyCells(grid: Grid): [number, number][] {
  const out: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c] === 0) out.push([r, c]);
  return out;
}

export function spawn(grid: Grid, rng: RNG): number[][] {
  const cells = emptyCells(grid);
  const next = grid.map((row) => [...row]);
  if (cells.length === 0) return next;
  const [r, c] = cells[Math.min(Math.floor(rng() * cells.length), cells.length - 1)];
  next[r][c] = rng() < 0.9 ? 2 : 4;
  return next;
}

export function isOver(grid: Grid): boolean {
  if (emptyCells(grid).length > 0) return false;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return false;
      if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return false;
    }
  }
  return true;
}

const TILE_COLOR: Record<number, string> = {
  0: FG.gray,
  2: FG.white,
  4: FG.cyan,
  8: FG.green,
  16: FG.green,
  32: FG.yellow,
  64: FG.yellow,
  128: FG.magenta,
  256: FG.magenta,
  512: FG.red,
  1024: FG.red,
  2048: FG.red,
};

function cell(value: number): string {
  const label = value === 0 ? "·" : String(value);
  const padded = label.padStart(Math.ceil((4 + label.length) / 2)).padEnd(4);
  return color(padded, TILE_COLOR[value] ?? FG.red);
}

const KEY_TO_MOVE: Record<string, Move> = {
  "\x1b[A": "up", "\x1b[B": "down", "\x1b[D": "left", "\x1b[C": "right",
  w: "up", s: "down", a: "left", d: "right",
};

function draw(grid: Grid, score: number, over: boolean, won: boolean): Drawn {
  const inner = SIZE * 5 - 1;
  const width = inner + 2;
  const lines: string[] = [color(`┌${"─".repeat(inner)}┐`, FG.gray)];
  grid.forEach((row, ri) => {
    const cells = row.map((v) => cell(v)).join(color("│", FG.gray));
    lines.push(color("│", FG.gray) + cells + color("│", FG.gray));
    if (ri < SIZE - 1) lines.push(color(`├${"─".repeat(inner)}┤`, FG.gray));
  });
  lines.push(color(`└${"─".repeat(inner)}┘`, FG.gray));

  let status: string;
  if (over) status = color(`${BOLD}GAME OVER`, FG.red) + `  ${color("score " + score, FG.yellow)}${RESET}`;
  else if (won) status = color(`${BOLD}2048! keep going`, FG.green) + `  ${color(String(score), FG.yellow)}${RESET}`;
  else status = `${BOLD}score ${color(String(score), FG.yellow)}${RESET}`;

  return { lines: lines.map((l) => center(l, width)), status, help: "WASD / arrows  ·  r restart" };
}

export const module: GameModule = {
  id: "twenty48",
  name: "2048",
  blurb: "Slide tiles, merge to 2048. Pure addiction.",
  realtime: false,
  tickMs: 0,
  create(rng: RNG, _cfg: GameConfig): RunningGame {
    let grid: number[][] = spawn(spawn(emptyGrid(), rng), rng);
    let score = 0;
    let over = false;
    let won = false;

    function reset(): void {
      grid = spawn(spawn(emptyGrid(), rng), rng);
      score = 0;
      over = false;
      won = false;
    }

    return {
      onKey(key: string): void {
        if (key === "r" || key === "R") return reset();
        if (over) return;
        const dir = KEY_TO_MOVE[key];
        if (dir === undefined) return;
        const res = move(grid, dir);
        if (!res.moved) return;
        score += res.gained;
        grid = spawn(res.grid, rng);
        if (!won && grid.some((row) => row.some((v) => v >= 2048))) won = true;
        if (isOver(grid)) over = true;
      },
      tick(): void {},
      draw(_view: View): Drawn {
        return draw(grid, score, over, won);
      },
      isOver(): boolean {
        return over;
      },
      restart(): void {
        reset();
      },
    };
  },
};
