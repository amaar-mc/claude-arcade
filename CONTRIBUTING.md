# Contributing to Claude Arcade

Thanks for wanting to help! Adding a game is intentionally easy.

## Setup

```sh
git clone https://github.com/amaar-mc/claude-arcade
cd claude-arcade
bun test          # everything should be green
bun arcade/arcade.ts   # play it locally (any terminal, no tmux needed)
```

## Add a game

1. Create `arcade/games/<yourgame>.ts`.
2. Keep the **rules pure**: export plain functions (no IO, inject `rng`) so they
   can be unit-tested. Look at `tictactoe.ts` for the smallest example.
3. Export a `module: GameModule` (see `arcade/types.ts`). Its `create()` returns
   a `RunningGame` shell that holds the live state and delegates to your pure
   functions.
4. Your `draw()` returns lines whose **visible width fits the pane** — render
   with the helpers in `arcade/render.ts` (`color`, `center`, …). Don't print
   ANSI by hand; the frame compositor handles positioning and clearing.
5. Register it in the `GAMES` array in `arcade/arcade.ts`.
6. Add `test/<yourgame>.test.ts`. The bar: cover the win/lose/draw logic and any
   engine. The smoke test (`/tmp` harness in CI) hammers random input and checks
   widths — keep your board ≤ the default pane width (52 cols).

## Conventions

- TypeScript, strict, run by Bun directly — **no build step**.
- Functional over OOP; pure functions for logic, thin shells for state.
- Conventional Commits (`feat:`, `fix:`, `docs:` …).
- `bun test` must pass. Keep games dependency-free where possible (chess is the
  one exception — it reuses the vendored `chess.js` rules engine).

## Ideas wanted

Minesweeper, Tetris, Wordle, Solitaire, 2048-style variants, a harder chess
eval. Open a PR — small and focused beats big and sprawling.
