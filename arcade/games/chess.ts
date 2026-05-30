// Chess vs. a small negamax/alpha-beta engine. You play White (bottom); the
// engine plays Black. All chess RULES come from the vendored chess.js (move
// generation, legality, check/mate/stalemate, FEN). This file only adds the
// search/eval and the terminal cursor UI.
//
// The engine (evalWhite/bestMove) is exported and unit-tested against chess.js.

import { Chess } from "../../vendor/chess.js";
import type { Drawn, GameConfig, GameModule, RNG, RunningGame, View } from "../types.ts";
import { BG, BOLD, DIM, FG, INVERSE, RESET, color, padTo } from "../render.ts";

export type Color = "w" | "b";
export type Piece = { readonly square: string; readonly type: string; readonly color: Color } | null;
export type VerboseMove = {
  readonly from: string;
  readonly to: string;
  readonly piece: string;
  readonly color: Color;
  readonly captured?: string;
  readonly promotion?: string;
  readonly san: string;
};

// Minimal structural view of the chess.js instance (the vendored file has no
// type declarations).
export type ChessGame = {
  move: (m: string | { from: string; to: string; promotion?: string }) => unknown;
  moves: (opts?: { square?: string; verbose?: boolean }) => VerboseMove[] | string[];
  board: () => Piece[][];
  turn: () => Color;
  isGameOver: () => boolean;
  isCheckmate: () => boolean;
  isStalemate: () => boolean;
  isDraw: () => boolean;
  isCheck: () => boolean;
  undo: () => unknown;
  fen: () => string;
};

export function newGame(): ChessGame {
  return new Chess() as unknown as ChessGame;
}

export function gameFromFen(fen: string): ChessGame {
  return new Chess(fen) as unknown as ChessGame;
}

const VAL: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const MATE = 1_000_000;

// White-positive static evaluation: material + light centralization + pawn push.
export function evalWhite(game: ChessGame): number {
  let score = 0;
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece === null) continue;
      let v = VAL[piece.type];
      const centerDist = Math.abs(3.5 - c) + Math.abs(3.5 - r);
      if (piece.type === "n" || piece.type === "b" || piece.type === "q") {
        v += Math.max(0, 6 - 2 * centerDist);
      }
      if (piece.type === "p") {
        v += (piece.color === "w" ? 6 - r : r - 1) * 4;
      }
      score += piece.color === "w" ? v : -v;
    }
  }
  return score;
}

function moveScore(m: VerboseMove): number {
  return m.captured !== undefined ? VAL[m.captured] * 10 - VAL[m.piece] : 0;
}

function ordered(game: ChessGame): VerboseMove[] {
  return (game.moves({ verbose: true }) as VerboseMove[]).slice().sort((a, b) => moveScore(b) - moveScore(a));
}

// Negamax with alpha-beta. Returns the score from the perspective of the side to
// move in `game`.
function negamax(game: ChessGame, depth: number, alpha: number, beta: number): number {
  if (game.isGameOver()) {
    if (game.isCheckmate()) return -(MATE + depth); // side to move is mated; prefer slower losses
    return 0; // stalemate / draw
  }
  if (depth <= 0) {
    const w = evalWhite(game);
    return game.turn() === "w" ? w : -w;
  }
  let best = -Infinity;
  let a = alpha;
  for (const m of ordered(game)) {
    game.move({ from: m.from, to: m.to, promotion: m.promotion });
    const score = -negamax(game, depth - 1, -beta, -a);
    game.undo();
    if (score > best) best = score;
    if (best > a) a = best;
    if (a >= beta) break;
  }
  return best;
}

// Best move for whichever side is to move in `game`.
export function bestMove(game: ChessGame, depth: number): VerboseMove | null {
  const moves = ordered(game);
  if (moves.length === 0) return null;
  let best = moves[0];
  let bestScore = -Infinity;
  let alpha = -Infinity;
  for (const m of moves) {
    game.move({ from: m.from, to: m.to, promotion: m.promotion });
    const score = -negamax(game, depth - 1, -Infinity, -alpha);
    game.undo();
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
    if (score > alpha) alpha = score;
  }
  return best;
}

function squareAt(row: number, col: number): string {
  return String.fromCharCode(97 + col) + String(8 - row);
}

function glyph(piece: Piece): string {
  if (piece === null) return color("·", FG.gray);
  const letter = piece.color === "w" ? piece.type.toUpperCase() : piece.type;
  return color(letter, piece.color === "w" ? FG.white : FG.cyan);
}

type Selection = { readonly from: string; readonly targets: ReadonlyMap<string, string | undefined> } | null;

function draw(game: ChessGame, cursorRow: number, cursorCol: number, sel: Selection): Drawn {
  const board = game.board();
  const width = 8 * 2 + 3;
  const lines: string[] = [];
  for (let r = 0; r < 8; r++) {
    let row = color(`${8 - r} `, FG.gray);
    for (let c = 0; c < 8; c++) {
      const sq = squareAt(r, c);
      const isCursor = r === cursorRow && c === cursorCol;
      const isFrom = sel !== null && sel.from === sq;
      const isTarget = sel !== null && sel.targets.has(sq);
      const piece = board[r][c];
      let cellChar = glyph(piece);
      if (isTarget && piece === null) cellChar = color("•", FG.green);
      let cell = `${cellChar} `;
      if (isCursor) cell = `${INVERSE}${cell}${RESET}`;
      else if (isFrom) cell = `${BG.yellow}${cell}${RESET}`;
      else if (isTarget) cell = `${BG.green}${cell}${RESET}`;
      row += cell;
    }
    lines.push(row);
  }
  lines.push(color("  a b c d e f g h", FG.gray));

  let status: string;
  if (game.isCheckmate()) {
    status = game.turn() === "w" ? color(`${BOLD}CHECKMATE — engine wins`, FG.red) : color(`${BOLD}CHECKMATE — you win!`, FG.green);
  } else if (game.isStalemate()) {
    status = color(`${BOLD}STALEMATE`, FG.yellow);
  } else if (game.isDraw()) {
    status = color(`${BOLD}DRAW`, FG.yellow);
  } else {
    const side = game.turn() === "w" ? color("your move", FG.white) : color("engine…", DIM);
    status = side + (game.isCheck() ? color("  ·  check!", FG.red) : "");
  }

  return { lines: lines.map((l) => padTo(l, width)), status, help: "arrows move  ·  enter select/move  ·  r restart" };
}

export const module: GameModule = {
  id: "chess",
  name: "Chess",
  blurb: "Play a real engine (chess.js rules). You're White.",
  realtime: false,
  tickMs: 0,
  create(_rng: RNG, cfg: GameConfig): RunningGame {
    const chessCfg = (cfg.chess ?? {}) as { aiDepth?: number };
    const depth = typeof chessCfg.aiDepth === "number" ? chessCfg.aiDepth : 2;
    let game = newGame();
    let cursorRow = 6;
    let cursorCol = 4;
    let sel: Selection = null;

    function legalFrom(square: string): Map<string, string | undefined> {
      const targets = new Map<string, string | undefined>();
      for (const m of game.moves({ square, verbose: true }) as VerboseMove[]) {
        // Auto-queen: if a square has multiple promotion moves, keep the queen
        // one rather than relying on chess.js enumeration order.
        if (m.promotion !== undefined && m.promotion !== "q" && targets.has(m.to)) continue;
        targets.set(m.to, m.promotion);
      }
      return targets;
    }

    function aiReply(): void {
      if (game.isGameOver() || game.turn() !== "b") return;
      const m = bestMove(game, depth);
      if (m !== null) game.move({ from: m.from, to: m.to, promotion: m.promotion });
    }

    function activate(): void {
      const sq = squareAt(cursorRow, cursorCol);
      if (sel === null) {
        if (game.turn() !== "w" || game.isGameOver()) return;
        const targets = legalFrom(sq);
        if (targets.size > 0) sel = { from: sq, targets };
        return;
      }
      if (sq === sel.from) {
        sel = null;
        return;
      }
      if (sel.targets.has(sq)) {
        game.move({ from: sel.from, to: sq, promotion: sel.targets.get(sq) });
        sel = null;
        aiReply();
        return;
      }
      // Reselect if the cursor is on another of the player's pieces.
      const targets = legalFrom(sq);
      sel = targets.size > 0 ? { from: sq, targets } : null;
    }

    function reset(): void {
      game = newGame();
      cursorRow = 6;
      cursorCol = 4;
      sel = null;
    }

    return {
      onKey(key: string): void {
        if (key === "r" || key === "R") return reset();
        if ((key === "\x1b[A" || key === "w") && cursorRow > 0) cursorRow -= 1;
        else if ((key === "\x1b[B" || key === "s") && cursorRow < 7) cursorRow += 1;
        else if ((key === "\x1b[D" || key === "a") && cursorCol > 0) cursorCol -= 1;
        else if ((key === "\x1b[C" || key === "d") && cursorCol < 7) cursorCol += 1;
        else if (key === "\r" || key === " ") activate();
      },
      tick(): void {},
      draw(_view: View): Drawn {
        return draw(game, cursorRow, cursorCol, sel);
      },
      isOver(): boolean {
        return game.isGameOver();
      },
      restart(): void {
        reset();
      },
    };
  },
};
