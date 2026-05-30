// Snake. Real-time: advances only while Claude is working.
// Pure logic (delta/step/spawnFood/...) is exported for tests; the RunningGame
// shell holds the live state and delegates to it.

import type { Drawn, GameConfig, GameModule, RNG, RunningGame, View } from "../types.ts";
import { BOLD, DIM, FG, RESET, center, color } from "../render.ts";

export type Point = { readonly x: number; readonly y: number };
export type Dir = "up" | "down" | "left" | "right";
export type Board = { readonly gridWidth: number; readonly gridHeight: number; readonly wrap: boolean };
export type SnakeState = {
  readonly snake: readonly Point[]; // head first
  readonly dir: Dir;
  readonly food: Point;
  readonly score: number;
  readonly alive: boolean;
  readonly won: boolean;
};

const DELTAS: Record<Dir, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const GRID_W = 22;
const GRID_H = 14;

function same(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

function occupies(snake: readonly Point[], p: Point): boolean {
  return snake.some((c) => same(c, p));
}

function isOpposite(a: Dir, b: Dir): boolean {
  return (
    (a === "up" && b === "down") ||
    (a === "down" && b === "up") ||
    (a === "left" && b === "right") ||
    (a === "right" && b === "left")
  );
}

export function nextDirection(current: Dir, requested: Dir): Dir {
  return isOpposite(current, requested) ? current : requested;
}

export function spawnFood(snake: readonly Point[], board: Board, rng: RNG): Point {
  const free: Point[] = [];
  for (let y = 0; y < board.gridHeight; y++) {
    for (let x = 0; x < board.gridWidth; x++) {
      if (!occupies(snake, { x, y })) free.push({ x, y });
    }
  }
  if (free.length === 0) return snake[0];
  return free[Math.min(Math.floor(rng() * free.length), free.length - 1)];
}

export function initialState(board: Board, rng: RNG): SnakeState {
  const cx = Math.floor(board.gridWidth / 2);
  const cy = Math.floor(board.gridHeight / 2);
  const snake: Point[] = [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ];
  return { snake, dir: "right", food: spawnFood(snake, board, rng), score: 0, alive: true, won: false };
}

export function step(state: SnakeState, board: Board, rng: RNG): SnakeState {
  if (!state.alive || state.won) return state;
  const d = DELTAS[state.dir];
  let hx = state.snake[0].x + d.x;
  let hy = state.snake[0].y + d.y;
  if (board.wrap) {
    hx = (hx + board.gridWidth) % board.gridWidth;
    hy = (hy + board.gridHeight) % board.gridHeight;
  } else if (hx < 0 || hy < 0 || hx >= board.gridWidth || hy >= board.gridHeight) {
    return { ...state, alive: false };
  }
  const head: Point = { x: hx, y: hy };
  const ate = same(head, state.food);
  const body = ate ? state.snake : state.snake.slice(0, state.snake.length - 1);
  if (occupies(body, head)) return { ...state, alive: false };
  const snake: Point[] = [head, ...body];
  if (!ate) return { ...state, snake };
  const full = snake.length >= board.gridWidth * board.gridHeight;
  return {
    snake,
    dir: state.dir,
    food: full ? head : spawnFood(snake, board, rng),
    score: state.score + 1,
    alive: true,
    won: full,
  };
}

const KEY_TO_DIR: Record<string, Dir> = {
  "\x1b[A": "up",
  "\x1b[B": "down",
  "\x1b[D": "left",
  "\x1b[C": "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

function draw(state: SnakeState, board: Board): Drawn {
  const grid: string[][] = Array.from({ length: board.gridHeight }, () =>
    Array.from({ length: board.gridWidth }, () => color("··", FG.gray)),
  );
  state.snake.forEach((p, i) => {
    grid[p.y][p.x] = color("██", i === 0 ? FG.green : FG.cyan);
  });
  grid[state.food.y][state.food.x] = color("◆◆", FG.red);

  const top = color(`┌${"──".repeat(board.gridWidth)}┐`, FG.gray);
  const bottom = color(`└${"──".repeat(board.gridWidth)}┘`, FG.gray);
  const rows = grid.map((r) => color("│", FG.gray) + r.join("") + color("│", FG.gray));

  const width = board.gridWidth * 2 + 2;
  const lines = [top, ...rows, bottom].map((l) => center(l, width));

  let status: string;
  if (state.won) status = color(`${BOLD}YOU FILLED THE BOARD!`, FG.green);
  else if (!state.alive) status = color(`${BOLD}GAME OVER`, FG.red) + color("  ·  press r", DIM);
  else status = `${BOLD}score ${color(String(state.score), FG.yellow)}${RESET}`;

  return { lines, status, help: "WASD / arrows  ·  r restart" };
}

export const module: GameModule = {
  id: "snake",
  name: "Snake",
  blurb: "Eat, grow, don't bite yourself. Classic.",
  realtime: true,
  tickMs: 120,
  create(rng: RNG, cfg: GameConfig): RunningGame {
    const snakeCfg = (cfg.snake ?? {}) as { wrap?: boolean };
    const board: Board = { gridWidth: GRID_W, gridHeight: GRID_H, wrap: snakeCfg.wrap === true };
    let state = initialState(board, rng);
    let pending: Dir = state.dir;
    return {
      onKey(key: string): void {
        if (key === "r" || key === "R") {
          state = initialState(board, rng);
          pending = state.dir;
          return;
        }
        const dir = KEY_TO_DIR[key];
        if (dir !== undefined) pending = dir;
      },
      tick(): void {
        state = step({ ...state, dir: nextDirection(state.dir, pending) }, board, rng);
      },
      draw(_view: View): Drawn {
        return draw(state, board);
      },
      isOver(): boolean {
        return !state.alive || state.won;
      },
      restart(): void {
        state = initialState(board, rng);
        pending = state.dir;
      },
    };
  },
};
