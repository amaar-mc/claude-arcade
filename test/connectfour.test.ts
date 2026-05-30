import { test, expect } from "bun:test";
import {
  type C4Board,
  bestColumn,
  drop,
  emptyBoard,
  winner,
} from "../arcade/games/connectfour.ts";

function play(moves: [number, "R" | "Y"][]): C4Board {
  let board = emptyBoard();
  for (const [col, p] of moves) {
    const next = drop(board, col, p);
    if (next === null) throw new Error(`illegal drop ${col}`);
    board = next;
  }
  return board;
}

test("drop stacks discs from the bottom", () => {
  const board = play([[3, "R"], [3, "Y"]]);
  expect(board[5][3]).toBe("R");
  expect(board[4][3]).toBe("Y");
});

test("detects a horizontal win", () => {
  const board = play([[0, "R"], [0, "Y"], [1, "R"], [1, "Y"], [2, "R"], [2, "Y"], [3, "R"]]);
  expect(winner(board)).toBe("R");
});

test("detects a vertical win", () => {
  const board = play([[0, "Y"], [1, "R"], [0, "Y"], [1, "R"], [0, "Y"], [1, "R"], [0, "Y"]]);
  expect(winner(board)).toBe("Y");
});

test("engine takes an immediate winning column", () => {
  // Yellow has three across the bottom in cols 0,1,2 -> must play col 3 to win.
  const board = play([[0, "Y"], [0, "R"], [1, "Y"], [1, "R"], [2, "Y"], [2, "R"]]);
  expect(bestColumn(board, 5, "Y")).toBe(3);
});

test("engine blocks the opponent's immediate win", () => {
  // Red threatens to complete cols 0,1,2 on the bottom row -> Yellow must block col 3.
  const board = play([[0, "R"], [0, "Y"], [1, "R"], [1, "Y"], [2, "R"]]);
  expect(bestColumn(board, 5, "Y")).toBe(3);
});
