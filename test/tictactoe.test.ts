import { test, expect } from "bun:test";
import { type Mark, bestMove, winner } from "../arcade/games/tictactoe.ts";

function b(s: string): Mark[] {
  return [...s].map((ch) => (ch === "X" ? "X" : ch === "O" ? "O" : null));
}

test("detects row/column/diagonal wins and draws", () => {
  expect(winner(b("XXX......"))).toBe("X");
  expect(winner(b("O..O..O.."))).toBe("O");
  expect(winner(b("X...X...X"))).toBe("X");
  expect(winner(b("XOXXOOOXX"))).toBe("draw");
  expect(winner(b("X........"))).toBe(null);
});

test("engine takes an immediate win", () => {
  // O at 0 and 1 -> winning move is 2.
  expect(bestMove(b("OO......."), "O")).toBe(2);
});

test("engine blocks an immediate loss", () => {
  // X threatens 0,1 -> O must block at 2.
  expect(bestMove(b("XX......."), "O")).toBe(2);
});

test("perfect vs perfect play is always a draw", () => {
  // Engine plays both sides optimally from every opening -> draw, never a loss.
  for (let opening = 0; opening < 9; opening++) {
    const board: Mark[] = Array.from({ length: 9 }, () => null);
    board[opening] = "X";
    let turn: "X" | "O" = "O";
    while (winner(board) === null) {
      const mv = bestMove(board, turn);
      board[mv] = turn;
      turn = turn === "X" ? "O" : "X";
    }
    expect(winner(board)).toBe("draw");
  }
});
