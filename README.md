<div align="center">

# 🕹 Claude Arcade

### Claude Code is working. So are your thumbs.

Play Snake, 2048, Tic-Tac-Toe, Connect Four, and Chess in a pane right next to Claude Code. The game runs while Claude thinks and pauses the moment it's done.

[![MIT License](https://img.shields.io/badge/license-MIT-22c55e.svg)](LICENSE)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-8b5cf6.svg)](https://docs.claude.com/en/docs/claude-code)
[![Runs on Bun](https://img.shields.io/badge/runs%20on-Bun-f9f1e1.svg)](https://bun.sh)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-22c55e.svg)](CONTRIBUTING.md)
[![GitHub stars](https://img.shields.io/github/stars/amaar-mc/claude-arcade?style=social)](https://github.com/amaar-mc/claude-arcade)

![Claude Arcade: play 2048 while Claude Code builds your landing page](assets/demo.gif)

</div>

## The games

| Game | You vs | Keys |
| --- | --- | --- |
| 🐍 Snake | your own tail | arrows or `WASD` |
| 🔢 2048 | the number gods | arrows or `WASD` |
| ⭕ Tic-Tac-Toe | a minimax engine that never loses | arrows + `enter`, or `1`-`9` |
| 🔴 Connect Four | an alpha-beta engine | `←` `→` + `enter`, or `1`-`7` |
| ♟ Chess | a real engine on [chess.js](https://github.com/jhlywa/chess.js) rules | arrows + `enter` |

## Quick start

You need [tmux](https://github.com/tmux/tmux) and [Bun](https://bun.sh):

```sh
brew install tmux       # Linux: your package manager
curl -fsSL https://bun.sh/install | bash
```

Install the plugin from inside Claude Code:

```
/plugin marketplace add amaar-mc/claude-arcade
/plugin install claude-arcade
```

Then run Claude Code inside tmux:

```sh
tmux
claude
```

The arcade pane opens on the right. Send a prompt and play. When Claude finishes, it pauses. That is the whole thing.

## Controls

| Key | Does |
| --- | --- |
| arrows / `WASD` | play the current game |
| `enter` | place / select |
| `Tab` | next game |
| `m` | game menu |
| `c` | settings |
| `r` | restart the game |
| `j` | hide the arcade pane |
| `Alt-j` | bring it back |

## Settings

Press `c` in the arcade for a live settings screen: default game, snake speed, wall wrap, engine difficulty, auto focus. Or run `/arcade` in Claude Code and say what to change. Everything saves to `~/.claude-arcade/config.json`.

## How it works

Claude Code owns the whole terminal, so the arcade rides in a tmux split beside it. Four hooks do all the work: `SessionStart` opens the pane, `UserPromptSubmit` starts the game, `Stop` pauses it, `SessionEnd` cleans up. Play and pause is one word in a file the game reads every frame. No forks, no patched internals.

## Add your own game

A game is one file. Write the rules as plain functions, return a `GameModule`, register it. Every game follows the same small contract in `arcade/types.ts`, and Tic-Tac-Toe is the easiest one to copy. Minesweeper, Tetris, and Wordle are all wide open. See [CONTRIBUTING.md](CONTRIBUTING.md).

```sh
bun test               # game logic and renderer tests
bun arcade/arcade.ts   # play it standalone, no tmux needed
```

## License

MIT, by Amaar Chughtai. Ships with [chess.js](https://github.com/jhlywa/chess.js) (BSD-2-Clause, see `vendor/chess.js.LICENSE`). If it made your Claude Code wait less boring, a ⭐ helps others find it.
