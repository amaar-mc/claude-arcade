import { test, expect } from "bun:test";
import {
  H, W,
  type ActivePiece, type Cell, type TetrisState,
  clearLines, collides, emptyBoard, hardDrop, initialState,
  softDrop, step, tryMove, tryRotate,
} from "../arcade/games/tetris.ts";

// floor(rng() * 7) bucket midpoints — picking a single kind from the RNG.
const PICK = { I: 0.05, O: 0.2, T: 0.35, S: 0.5, Z: 0.65, J: 0.8, L: 0.95 };
const rngOf = (...vs: number[]) => { let i = 0; return () => vs[i++ % vs.length]; };

test("empty board is H × W of nulls", () => {
  const b = emptyBoard();
  expect(b.length).toBe(H);
  expect(b[0].length).toBe(W);
  expect(b.flat().every((c) => c === null)).toBe(true);
});

test("initialState has score 0 and a live piece", () => {
  const s = initialState(rngOf(PICK.I, PICK.I));
  expect(s.score).toBe(0);
  expect(s.lines).toBe(0);
  expect(s.gameOver).toBe(false);
  expect(s.active.kind).toBe("I");
  expect(s.next).toBe("I");
});

test("collides detects walls and floor", () => {
  const b = emptyBoard();
  expect(collides(b, { kind: "I", rot: 0, x: -1,    y: 0       })).toBe(true);  // left
  expect(collides(b, { kind: "I", rot: 0, x: W - 3, y: 0       })).toBe(true);  // right
  expect(collides(b, { kind: "I", rot: 0, x: 0,     y: H - 1   })).toBe(true);  // floor
  expect(collides(b, { kind: "I", rot: 0, x: 0,     y: 0       })).toBe(false);
});

test("collides detects settled blocks", () => {
  const b = emptyBoard();
  b[5][5] = "x";
  expect(collides(b, { kind: "O", rot: 0, x: 4, y: 4 })).toBe(true);
});

test("step drops the piece one row", () => {
  const s = initialState(rngOf(PICK.I, PICK.O));
  const next = step(s, rngOf(PICK.T));
  expect(next.active.y).toBe(s.active.y + 1);
});

test("clearLines drops full rows and pushes the rest down", () => {
  const b = emptyBoard();
  for (let x = 0; x < W; x++) b[H - 1][x] = "x";
  for (let x = 0; x < 3; x++) b[H - 2][x] = "x";

  const { board, cleared } = clearLines(b);
  expect(cleared).toBe(1);
  expect(board[H - 1].slice(0, 3).every((c) => c === "x")).toBe(true);
  expect(board[H - 1].slice(3).every((c) => c === null)).toBe(true);
  expect(board[0].every((c) => c === null)).toBe(true);
});

test("four-line clear scores 800", () => {
  const board = emptyBoard();
  for (let y = H - 4; y < H; y++) {
    for (let x = 1; x < W; x++) board[y][x] = "x";
  }
  const active: ActivePiece = { kind: "I", rot: 1, x: -2, y: H - 4 };
  const s: TetrisState = { board, active, next: "O", score: 0, lines: 0, gameOver: false };

  const after = hardDrop(s, rngOf(PICK.I));
  expect(after.lines).toBe(4);
  expect(after.score).toBeGreaterThanOrEqual(800);
});

test("softDrop gives 1 point per row", () => {
  const s = initialState(rngOf(PICK.O, PICK.O));
  const after = softDrop(s, rngOf(PICK.O));
  expect(after.active.y).toBe(s.active.y + 1);
  expect(after.score).toBe(1);
});

test("hardDrop lands the piece on the floor", () => {
  const s = initialState(rngOf(PICK.O, PICK.O));
  const after = hardDrop(s, rngOf(PICK.O));
  // O at x=3 fills columns 4-5 on the bottom two rows.
  expect(after.board[H - 1][4]).not.toBeNull();
  expect(after.board[H - 1][5]).not.toBeNull();
  expect(after.board[H - 2][4]).not.toBeNull();
  expect(after.board[H - 2][5]).not.toBeNull();
  expect(after.score).toBeGreaterThan(0);
});

test("tryMove stops at the wall", () => {
  let s = initialState(rngOf(PICK.O, PICK.O));
  for (let i = 0; i < 20; i++) s = tryMove(s, -1);
  expect(s.active.x).toBe(-1); // O's leftmost cell offset is 1
  expect(tryMove(s, -1).active.x).toBe(s.active.x);
});

test("rotating O is a no-op shape-wise", () => {
  const s = initialState(rngOf(PICK.O, PICK.O));
  expect(tryRotate(s).active.rot).toBe(1);
});

test("game ends when the next piece can't fit", () => {
  // Block the spawn rows for the next O at cols 3-8, leave col 9 open so no
  // line clear gets triggered before the new piece spawns.
  const board: Cell[][] = emptyBoard();
  for (let y = 0; y < 2; y++) for (let x = 3; x < W - 1; x++) board[y][x] = "x";

  const active: ActivePiece = { kind: "O", rot: 0, x: 0, y: H - 2 };
  const s: TetrisState = { board, active, next: "O", score: 0, lines: 0, gameOver: false };

  expect(step(s, rngOf(PICK.O)).gameOver).toBe(true);
});
