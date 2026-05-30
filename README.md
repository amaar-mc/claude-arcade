<div align="center">

# 🕹 Claude Arcade

**Play games in a side-pane while Claude Code works.**

Snake · 2048 · Tic-Tac-Toe · Connect Four · Chess — running in your terminal,
right next to Claude. The games play while Claude is generating and **pause the
moment it's done**, so you stay at your desk instead of doom-scrolling.

```
┌─ Claude Code ────────────────┐ ┌─ Claude Arcade ───────────┐
│ > build the dashboard         │ │   ▞▚ CLAUDE ARCADE ▚▞      │
│ ● Working… (esc to cancel)    │ │   ┌──────────────────┐    │
│   - writing components/…      │ │   │········██████····│    │
│   - wiring the API route      │ │   │····◆◆············│    │
│                               │ │   └──────────────────┘    │
│        (your prompt)          │ │   score 7   ● Claude…     │
└───────────────────────────────┘ └───────────────────────────┘
```

<sub>↑ a recorded GIF goes here before launch — see <a href="#make-the-gif">Make the GIF</a>.</sub>

</div>

## Why

Claude Code is fast, but you still wait. Claude Arcade fills the wait with a
real game on the right while Claude's output streams on the left — same window,
zero context-switch. Stop a prompt, you stop the game. Send another, you're
back in. It's a tmux split driven entirely by Claude Code hooks. No patched
internals, no private APIs.

## Games

| Game | Opponent | Controls |
| --- | --- | --- |
| 🐍 **Snake** | yourself | arrows / `WASD` |
| 🔢 **2048** | yourself | arrows / `WASD` |
| ⭕ **Tic-Tac-Toe** | perfect minimax engine | arrows + `enter`, or `1`–`9` |
| 🔴 **Connect Four** | alpha-beta engine | `←`/`→` + `enter`, or `1`–`7` |
| ♟ **Chess** | engine on [chess.js](https://github.com/jhlywa/chess.js) rules | arrows + `enter` |

`Tab` cycles games · `m` menu · `c` settings · `j` hide the pane (`Alt-j` brings it back).

## Setup

**Requires:** [tmux](https://github.com/tmux/tmux) and [Bun](https://bun.sh). Both common, both one `brew install`.

```sh
# In Claude Code:
/plugin marketplace add amaar-mc/claude-arcade
/plugin install claude-arcade
```

Then run Claude Code **inside tmux** — start a tmux session and run `claude`, or
use the bundled launcher (adds `Alt-←`/`Alt-→` pane switching):

```sh
claude-arcade           # = claude, wrapped in a ready-to-play tmux session
```

The arcade pane opens automatically. Submit a prompt → it plays. Claude finishes
→ it pauses. That's it.

## Settings

Press **`c`** in the arcade for a live settings screen (default game, snake
speed, wall-wrap, engine difficulty, auto-focus). Or run **`/arcade`** in Claude
Code to edit them from chat. Everything persists in `~/.claude-arcade/config.json`.

## How it works

```
┌─ Claude Code ───────────────┐ ┌─ Claude Arcade ─────────┐
│ > build the dashboard        │ │  ♟ Chess   ● Claude…    │
│ ● Working… (esc to cancel)   │ │  8 r n b q k b n r      │
│   - writing components/…     │ │  7 p p p p · p p p      │
│   - wiring the API route     │ │  ...                    │
└──────────────────────────────┘ └─────────────────────────┘
   UserPromptSubmit → play          Stop → pause + focus back
```

Four Claude Code hooks do all the work: `SessionStart` splits the pane,
`UserPromptSubmit` plays, `Stop` pauses, `SessionEnd` cleans up. Play/pause is a
one-word state file the game polls each frame.

## Develop

```sh
bun test                 # game-logic + renderer tests
bun arcade/arcade.ts     # run the arcade standalone in your terminal
```

Pure game logic lives in `arcade/games/*` (deterministic, unit-tested);
rendering is centralized in `arcade/render.ts`. Adding a game = one file
implementing the `GameModule` contract in `arcade/types.ts`. PRs welcome — see
[CONTRIBUTING.md](CONTRIBUTING.md).

## Make the GIF

A good loop sells it. Record one with [VHS](https://github.com/charmbracelet/vhs):

```sh
brew install vhs
vhs assets/demo.tape     # writes assets/demo.gif
```

Edit `assets/demo.tape` to taste, or record live with
[asciinema](https://asciinema.org) + [agg](https://github.com/asciinema/agg).

## License

MIT © Amaar Chughtai. Bundles [chess.js](https://github.com/jhlywa/chess.js)
(BSD-2-Clause, see `vendor/chess.js.LICENSE`).
