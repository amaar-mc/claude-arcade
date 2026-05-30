import { test, expect } from "bun:test";
import { type Grid, isOver, move, slideLine, spawn } from "../arcade/games/twenty48.ts";

test("slideLine compresses and merges once", () => {
  expect(slideLine([2, 2, 0, 0])).toEqual({ line: [4, 0, 0, 0], gained: 4 });
  expect(slideLine([2, 2, 2, 2])).toEqual({ line: [4, 4, 0, 0], gained: 8 });
  expect(slideLine([2, 0, 2, 0])).toEqual({ line: [4, 0, 0, 0], gained: 4 });
  expect(slideLine([4, 4, 4, 0])).toEqual({ line: [8, 4, 0, 0], gained: 8 });
  expect(slideLine([2, 4, 8, 16])).toEqual({ line: [2, 4, 8, 16], gained: 0 });
});

test("move left merges rows and reports movement", () => {
  const grid: Grid = [
    [2, 2, 0, 0],
    [0, 0, 0, 0],
    [4, 0, 4, 0],
    [8, 8, 8, 8],
  ];
  const res = move(grid, "left");
  expect(res.moved).toBe(true);
  expect(res.grid[0]).toEqual([4, 0, 0, 0]);
  expect(res.grid[2]).toEqual([8, 0, 0, 0]);
  expect(res.grid[3]).toEqual([16, 16, 0, 0]);
  expect(res.gained).toBe(4 + 8 + 16 + 16);
});

test("a move that changes nothing is not counted as moved", () => {
  const grid: Grid = [
    [2, 4, 8, 16],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  expect(move(grid, "left").moved).toBe(false);
});

test("spawn fills exactly one empty cell with 2 or 4", () => {
  const grid: Grid = [
    [2, 4, 8, 16],
    [2, 4, 8, 16],
    [2, 4, 8, 16],
    [2, 4, 8, 0],
  ];
  const next = spawn(grid, () => 0);
  expect(next[3][3] === 2 || next[3][3] === 4).toBe(true);
});

test("isOver is true only with no empties and no merges", () => {
  const full: Grid = [
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 2],
  ];
  expect(isOver(full)).toBe(true);
  const playable: Grid = [
    [2, 2, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 2],
  ];
  expect(isOver(playable)).toBe(false);
});
