// Tetris. Real-time: gravity ticks while Claude is working.
// Pure logic (collides/clearLines/step/...) is exported for tests.

import type { Drawn, GameConfig, GameModule, RNG, RunningGame, View } from "../types.ts";
import { BOLD, DIM, FG, RESET, center, color } from "../render.ts";

export const W = 10;
export const H = 18;

export type PieceKind = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Cell = string | null; // ANSI color code, or null

type Offset = readonly [number, number];
type PieceDef = { readonly color: string; readonly rotations: readonly (readonly Offset[])[] };

// Standard guideline colors via 24-bit truecolor. The 8-color palette doesn't
// have orange (L) and renders dark blue (J) as near-black.
const rgb = (r: number, g: number, b: number): string => `\x1b[38;2;${r};${g};${b}m`;

const PIECES: Record<PieceKind, PieceDef> = {
  I: { color: rgb(0, 240, 240), rotations: [
    [[0,1],[1,1],[2,1],[3,1]], [[2,0],[2,1],[2,2],[2,3]],
    [[0,2],[1,2],[2,2],[3,2]], [[1,0],[1,1],[1,2],[1,3]],
  ]},
  O: { color: rgb(240, 240, 0), rotations: [
    [[1,0],[2,0],[1,1],[2,1]], [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]], [[1,0],[2,0],[1,1],[2,1]],
  ]},
  T: { color: rgb(160, 0, 240), rotations: [
    [[0,1],[1,1],[2,1],[1,0]], [[1,0],[1,1],[1,2],[2,1]],
    [[0,1],[1,1],[2,1],[1,2]], [[1,0],[1,1],[1,2],[0,1]],
  ]},
  S: { color: rgb(0, 240, 0), rotations: [
    [[1,0],[2,0],[0,1],[1,1]], [[1,0],[1,1],[2,1],[2,2]],
    [[1,1],[2,1],[0,2],[1,2]], [[0,0],[0,1],[1,1],[1,2]],
  ]},
  Z: { color: rgb(240, 0, 0), rotations: [
    [[0,0],[1,0],[1,1],[2,1]], [[2,0],[1,1],[2,1],[1,2]],
    [[0,1],[1,1],[1,2],[2,2]], [[1,0],[0,1],[1,1],[0,2]],
  ]},
  J: { color: rgb(0, 0, 240), rotations: [
    [[0,0],[0,1],[1,1],[2,1]], [[1,0],[2,0],[1,1],[1,2]],
    [[0,1],[1,1],[2,1],[2,2]], [[1,0],[1,1],[0,2],[1,2]],
  ]},
  L: { color: rgb(240, 160, 0), rotations: [
    [[2,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[1,2],[2,2]],
    [[0,1],[1,1],[2,1],[0,2]], [[0,0],[1,0],[1,1],[1,2]],
  ]},
};

const KINDS: readonly PieceKind[] = ["I", "O", "T", "S", "Z", "J", "L"];
const LINE_SCORE = [0, 100, 300, 500, 800] as const;

export type ActivePiece = {
  readonly kind: PieceKind;
  readonly rot: number;
  readonly x: number;
  readonly y: number;
};

export type TetrisState = {
  readonly board: readonly (readonly Cell[])[];
  readonly active: ActivePiece;
  readonly next: PieceKind;
  readonly score: number;
  readonly lines: number;
  readonly gameOver: boolean;
};

function randomKind(rng: RNG): PieceKind {
  return KINDS[Math.min(Math.floor(rng() * KINDS.length), KINDS.length - 1)];
}

export function emptyBoard(): Cell[][] {
  return Array.from({ length: H }, () => Array.from({ length: W }, () => null));
}

function cellsOf(p: ActivePiece): Array<{ x: number; y: number }> {
  return PIECES[p.kind].rotations[p.rot].map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }));
}

export function collides(board: readonly (readonly Cell[])[], piece: ActivePiece): boolean {
  for (const { x, y } of cellsOf(piece)) {
    if (x < 0 || x >= W || y >= H) return true;
    if (y < 0) continue;
    if (board[y][x] !== null) return true;
  }
  return false;
}

// Spawn at y=0 so the whole piece is visible from frame one.
function spawn(kind: PieceKind): ActivePiece {
  return { kind, rot: 0, x: 3, y: 0 };
}

export function initialState(rng: RNG): TetrisState {
  return {
    board: emptyBoard(),
    active: spawn(randomKind(rng)),
    next: randomKind(rng),
    score: 0,
    lines: 0,
    gameOver: false,
  };
}

function lock(board: readonly (readonly Cell[])[], piece: ActivePiece): Cell[][] {
  const next = board.map((row) => [...row]);
  const c = PIECES[piece.kind].color;
  for (const { x, y } of cellsOf(piece)) {
    if (y >= 0 && y < H && x >= 0 && x < W) next[y][x] = c;
  }
  return next;
}

export function clearLines(board: readonly (readonly Cell[])[]): { board: Cell[][]; cleared: number } {
  const kept = board.filter((row) => row.some((c) => c === null));
  const cleared = H - kept.length;
  const empties: Cell[][] = Array.from({ length: cleared }, () => Array.from({ length: W }, () => null));
  return { board: [...empties, ...kept.map((r) => [...r])], cleared };
}

function settle(state: TetrisState, rng: RNG): TetrisState {
  const { board, cleared } = clearLines(lock(state.board, state.active));
  const active = spawn(state.next);
  return {
    board,
    active,
    next: randomKind(rng),
    score: state.score + LINE_SCORE[cleared],
    lines: state.lines + cleared,
    gameOver: collides(board, active),
  };
}

export function step(state: TetrisState, rng: RNG): TetrisState {
  if (state.gameOver) return state;
  const moved = { ...state.active, y: state.active.y + 1 };
  return collides(state.board, moved) ? settle(state, rng) : { ...state, active: moved };
}

export function tryMove(state: TetrisState, dx: number): TetrisState {
  if (state.gameOver) return state;
  const moved = { ...state.active, x: state.active.x + dx };
  return collides(state.board, moved) ? state : { ...state, active: moved };
}

const KICKS = [0, -1, 1, -2, 2] as const;

export function tryRotate(state: TetrisState): TetrisState {
  if (state.gameOver) return state;
  const rot = (state.active.rot + 1) % 4;
  for (const dx of KICKS) {
    const candidate = { ...state.active, rot, x: state.active.x + dx };
    if (!collides(state.board, candidate)) return { ...state, active: candidate };
  }
  return state;
}

export function softDrop(state: TetrisState, rng: RNG): TetrisState {
  if (state.gameOver) return state;
  const moved = { ...state.active, y: state.active.y + 1 };
  if (collides(state.board, moved)) return settle(state, rng);
  return { ...state, active: moved, score: state.score + 1 };
}

export function hardDrop(state: TetrisState, rng: RNG): TetrisState {
  if (state.gameOver) return state;
  let y = state.active.y;
  while (!collides(state.board, { ...state.active, y: y + 1 })) y++;
  const dropped = y - state.active.y;
  return settle(
    { ...state, active: { ...state.active, y }, score: state.score + dropped * 2 },
    rng,
  );
}

// Where the active piece would land on a straight drop.
function ghostY(board: readonly (readonly Cell[])[], piece: ActivePiece): number {
  let y = piece.y;
  while (!collides(board, { ...piece, y: y + 1 })) y++;
  return y;
}

function draw(state: TetrisState): Drawn {
  const grid: string[][] = state.board.map((row) =>
    row.map((c) => (c === null ? "  " : color("██", c))),
  );

  if (!state.gameOver) {
    const c = PIECES[state.active.kind].color;
    const ghost = { ...state.active, y: ghostY(state.board, state.active) };
    // Ghost first so the live piece overpaints on overlap.
    for (const { x, y } of cellsOf(ghost)) {
      if (y >= 0 && y < H && x >= 0 && x < W) grid[y][x] = color("░░", c);
    }
    for (const { x, y } of cellsOf(state.active)) {
      if (y >= 0 && y < H && x >= 0 && x < W) grid[y][x] = color("██", c);
    }
  }

  // Full-block walls so the playfield edge is flush with the pieces.
  const wall = color("██", FG.gray);
  const width = W * 2 + 4;
  const cap = color("█".repeat(width), FG.gray);
  const body = grid.map((r) => wall + r.join("") + wall);
  const lines = [cap, ...body, cap].map((l) => center(l, width));

  const status = state.gameOver
    ? color(`${BOLD}GAME OVER`, FG.red) +
      color(`  ·  ${state.score} pts  ·  ${state.lines} lines  ·  press r`, DIM)
    : `${BOLD}${color(String(state.score), FG.yellow)}${RESET}` +
      `  ${color(`${state.lines} lines`, DIM)}` +
      `  ${color("next", DIM)} ${color(state.next, PIECES[state.next].color)}`;

  return {
    lines,
    status,
    help: "←→ move · ↑/z rotate · ↓ soft · space drop · r restart",
  };
}

export const module: GameModule = {
  id: "tetris",
  name: "Tetris",
  blurb: "Stack tetrominoes, clear lines, don't top out.",
  realtime: true,
  tickMs: 500,
  create(rng: RNG, _cfg: GameConfig): RunningGame {
    let state = initialState(rng);
    return {
      onKey(key: string): void {
        if (key === "r" || key === "R") {
          state = initialState(rng);
          return;
        }
        if (state.gameOver) return;
        if (key === "\x1b[D" || key === "a") state = tryMove(state, -1);
        else if (key === "\x1b[C" || key === "d") state = tryMove(state, 1);
        else if (key === "\x1b[A" || key === "w" || key === "z") state = tryRotate(state);
        else if (key === "\x1b[B" || key === "s") state = softDrop(state, rng);
        else if (key === " " || key === "\r") state = hardDrop(state, rng);
      },
      tick(): void {
        state = step(state, rng);
      },
      draw(_view: View): Drawn {
        return draw(state);
      },
      isOver(): boolean {
        return state.gameOver;
      },
      restart(): void {
        state = initialState(rng);
      },
    };
  },
};
