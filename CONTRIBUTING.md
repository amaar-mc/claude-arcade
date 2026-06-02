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
4. Your `draw()` returns lines whose **visible width fits the pane** - render
   with the helpers in `arcade/render.ts` (`color`, `center`, …). Don't print
   ANSI by hand; the frame compositor handles positioning and clearing.
5. Register it in the `GAMES` array in `arcade/arcade.ts`.
6. Add `test/<yourgame>.test.ts` covering the win/lose/draw logic and any engine.
   Keep your board within the default pane width (52 cols) so it never bleeds
   into Claude's pane - `bun test` plus a quick `bun arcade/arcade.ts` to eyeball
   it is the bar.

## Conventions

- TypeScript, strict, run by Bun directly - **no build step**.
- Functional over OOP; pure functions for logic, thin shells for state.
- Conventional Commits (`feat:`, `fix:`, `docs:` …).
- `bun test` must pass. Keep games dependency-free where possible (chess is the
  one exception - it reuses the vendored `chess.js` rules engine).

## Ideas wanted

Minesweeper, Wordle, Solitaire, 2048-style variants, a harder chess
eval. Open a PR - small and focused beats big and sprawling.

## Recording the demo GIF (maintainers)

The README hero can be a recorded GIF. `assets/demo.tape` is a [VHS](https://github.com/charmbracelet/vhs)
script for it:

```sh
brew install vhs
vhs assets/demo.tape   # writes assets/demo.gif
```

Tweak the tape to taste, commit `assets/demo.gif`, and swap the ASCII block in
the README for `![Claude Arcade demo](assets/demo.gif)`.
