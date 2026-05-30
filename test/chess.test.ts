import { test, expect } from "bun:test";
import { type VerboseMove, bestMove, gameFromFen, newGame } from "../arcade/games/chess.ts";

test("opening move is legal and non-null", () => {
  const game = newGame();
  const m = bestMove(game, 2);
  expect(m).not.toBeNull();
  expect((m as VerboseMove).from.length).toBe(2);
});

test("engine captures a hanging queen", () => {
  // White pawn on e4 can take the black queen on d5.
  const game = gameFromFen("4k3/8/8/3q4/4P3/8/8/4K3 w - - 0 1");
  const m = bestMove(game, 2) as VerboseMove;
  expect(m.to).toBe("d5");
  expect(m.captured).toBe("q");
});

test("engine finds mate in one", () => {
  // White: Re8 is checkmate (back rank, black king boxed in by its own pawns).
  const game = gameFromFen("6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1");
  const m = bestMove(game, 2) as VerboseMove;
  game.move({ from: m.from, to: m.to, promotion: m.promotion });
  expect(game.isCheckmate()).toBe(true);
});
