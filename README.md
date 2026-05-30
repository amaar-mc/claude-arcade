<div align="center">

# 🕹 Claude Arcade

### Claude Code is working. So are your thumbs.

Play Snake, 2048, Tic-Tac-Toe, Connect Four, and Chess in a little pane right next to Claude Code. The game runs while Claude thinks and freezes the second it's done, so the wait actually goes somewhere.

[![MIT License](https://img.shields.io/badge/license-MIT-22c55e.svg)](LICENSE)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-8b5cf6.svg)](https://docs.claude.com/en/docs/claude-code)
[![Runs on Bun](https://img.shields.io/badge/runs%20on-Bun-f9f1e1.svg)](https://bun.sh)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-22c55e.svg)](CONTRIBUTING.md)
[![GitHub stars](https://img.shields.io/github/stars/amaar-mc/claude-arcade?style=social)](https://github.com/amaar-mc/claude-arcade)

```
┌─ Claude Code ─────────────────┐ ┌─ Claude Arcade ───────────┐
│ > build the dashboard          │ │   ▞▚ CLAUDE ARCADE ▚▞      │
│ ● Working... (esc to cancel)   │ │   ┌──────────────────┐    │
│   - writing components/...      │ │   │·······███████····│    │
│   - wiring the API route        │ │   │····◆◆············│    │
│                                │ │   └──────────────────┘    │
│        (your prompt)           │ │   score 7    ● Claude...  │
└────────────────────────────────┘ └───────────────────────────┘
```

<sub>A real GIF goes here before launch. See <a href="#make-a-gif">Make a GIF</a>.</sub>

</div>

## The idea

You fire off a prompt. Claude starts cranking. Instead of watching a spinner or flipping to Twitter, you get a real game on the right side of the same terminal. Output streams on the left, you play on the right. Claude finishes, the game pauses, you read the result and send the next prompt. Back in.

No forks, no patched internals. It's a tmux split wired up with Claude Code hooks.

## The games

| Game | You vs | Keys |
| --- | --- | --- |
| 🐍 Snake | gravity and your own tail | arrows or `WASD` |
| 🔢 2048 | the number gods | arrows or `WASD` |
| ⭕ Tic-Tac-Toe | a minimax engine that never loses | arrows + `enter`, or `1`-`9` |
| 🔴 Connect Four | an alpha-beta engine | `←` `→` + `enter`, or `1`-`7` |
| ♟ Chess | a real engine on [chess.js](https://github.com/jhlywa/chess.js) rules | arrows + `enter` |

`Tab` switches games. `c` opens settings. `j` hides the pane, `Alt-j` brings it back.

## Quick start

You need [tmux](https://github.com/tmux/tmux) and [Bun](https://bun.sh). Both are a one-line `brew install`.

Install the plugin from inside Claude Code:

```
/plugin marketplace add amaar-mc/claude-arcade
/plugin install claude-arcade
```

Then run Claude Code inside tmux. Use your own session, or let the launcher set one up:

```sh
claude-arcade
```

The arcade pops up on the right. Send a prompt and play. When Claude is done, it pauses. That's the whole thing.

## Settings

Hit `c` in the arcade for a live settings screen: default game, snake speed, wall wrap, engine difficulty, auto focus. Prefer chat? Run `/arcade` and tell Claude what to change. It all saves to `~/.claude-arcade/config.json`.

## How it works

```
┌─ Claude Code ────────────────┐ ┌─ Claude Arcade ─────────┐
│ > build the dashboard         │ │  ♟ Chess    ● Claude... │
│ ● Working... (esc to cancel)  │ │  8 r n b q k b n r      │
│   - writing components/...     │ │  7 p p p p · p p p      │
│   - wiring the API route       │ │  ...                    │
└───────────────────────────────┘ └─────────────────────────┘
  UserPromptSubmit starts it        Stop pauses it
```

Four hooks, no magic. `SessionStart` opens the pane, `UserPromptSubmit` starts the game, `Stop` pauses it, `SessionEnd` cleans up. Play and pause is one word in a file the game reads every frame.

## Add your own game

A game is one file. Write the rules as plain functions, hand back a `GameModule`, register it, done. Every game follows the same small contract in `arcade/types.ts`, and Tic-Tac-Toe is the easiest one to copy.

Want Minesweeper, Tetris, or Wordle in here? Open a PR. [CONTRIBUTING.md](CONTRIBUTING.md) has the short version.

```sh
bun test               # game logic and renderer tests
bun arcade/arcade.ts   # play it standalone, no tmux needed
```

## Make a GIF

A good loop sells the repo. Record one with [VHS](https://github.com/charmbracelet/vhs):

```sh
brew install vhs
vhs assets/demo.tape   # writes assets/demo.gif
```

Tweak `assets/demo.tape`, or record a live session with [asciinema](https://asciinema.org).

## Star it

If this made your Claude Code wait less boring, drop a ⭐. It helps other people find it.

## License

MIT, by Amaar Chughtai. Ships with [chess.js](https://github.com/jhlywa/chess.js) (BSD-2-Clause, see `vendor/chess.js.LICENSE`).
