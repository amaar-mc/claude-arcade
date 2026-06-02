<div align="center">

# 🕹 Claude Arcade

### Claude Code is working. So are your thumbs.

Play Snake, 2048, Tic-Tac-Toe, Connect Four, Chess, and more in a pane right next to Claude Code. The game runs while Claude thinks and pauses the moment it's done.

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
| 🧱 Tetris | your own stacking pieces | `←→` move · `↑`/`z` rotate · `↓` soft · `space` hard |

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

## 📱 Reels mode (macOS only, off by default)

Don't want a game? Want to doomscroll instead? **Reels mode** flips the arcade inside out: an Instagram Reels tab in **Google Chrome** plays *while Claude is working* and **freezes the instant Claude stops**, snapping focus back to your terminal. The wait is the only time you're allowed to scroll — the second there's work to read, it cuts you off.

**Reels mode is OFF until you turn it on. It needs no tmux** (it drives Chrome, not a terminal pane). When reels is on, the tmux arcade pane stands down; turn reels off and the arcade comes back.

### Turn it on — exact steps, do them in order

You only do steps 1–4 once. After that, reels just works every session until you turn it off.

1. **Install the plugin** (same as the arcade above):
   ```
   /plugin marketplace add amaar-mc/claude-arcade
   /plugin install claude-arcade
   ```

2. **Open Google Chrome and log in to Instagram.** Go to **https://www.instagram.com** and sign in. If you are *not* logged in, reels mode opens a login wall instead of reels and nothing plays. You must stay logged in.

3. **Let Chrome accept commands from Claude** (one time). In Chrome's top menu bar:
   **View → Developer → Allow JavaScript from Apple Events** — click it so it shows a **checkmark ✓**. Then **fully quit Chrome (⌘Q) and reopen it.** Without this, reels cannot play or pause.

4. **In Claude Code, run the command:**
   ```
   /reels on
   ```
   This is the switch. It is the *only* thing that turns reels on. After this, **every prompt you send opens and plays reels while Claude works.**

5. **On your very first prompt after `/reels on`, macOS shows one or two popups** like *“Terminal wants to control Google Chrome”* and *“…control System Events.”* Click **OK** on each (one time per app). If you click Don't Allow, reels can't drive Chrome — fix it in System Settings → Privacy & Security → Automation.

That's it. Send a prompt → reels play in Chrome. Claude finishes → reels freeze, terminal comes back.

### Turn it off / check it

| Command | What it does |
| --- | --- |
| `/reels on` | Turn reels mode on (creates the marker; arcade pane steps aside) |
| `/reels off` | Turn reels mode off (freezes any reel, restores the arcade) |
| `/reels status` | Show on/off **and** whether the Chrome ↔ Claude bridge is working |

If `/reels status` says the JS bridge is **BLOCKED**, you missed step 3 — redo it and restart Chrome.

### Good to know

- **macOS only.** On Linux/Windows reels mode does nothing (the arcade still works everywhere tmux runs).
- **Chrome is the default.** Brave and Edge also work (set `"browser"` in `~/.claude-arcade/config.json`). **Arc and Safari users:** Safari works but needs its own Develop-menu toggle; Arc is unsupported.
- **Sound:** browsers block autoplay *with* sound until you click once. Video and pausing always work; you may need one manual unmute per session.
- Full details, config knobs, and limitations: [`reels/README.md`](reels/README.md).

## How it works

Claude Code owns the whole terminal, so the arcade rides in a tmux split beside it. Four hooks do all the work: `SessionStart` opens the pane, `UserPromptSubmit` starts the game, `Stop` pauses it, `SessionEnd` cleans up. Play and pause is one word in a file the game reads every frame. No forks, no patched internals.

[Reels mode](#-reels-mode-macos-only-off-by-default) reuses the same four hooks, pointed at Chrome instead of a tmux pane: `UserPromptSubmit` plays the in-view reel via AppleScript, `Stop` freezes it and returns focus to your terminal. The two modes share the `~/.claude-arcade/reels-on` marker so exactly one is ever active.

## Add your own game

A game is one file. Write the rules as plain functions, return a `GameModule`, register it. Every game follows the same small contract in `arcade/types.ts`, and Tic-Tac-Toe is the easiest one to copy. Minesweeper and Wordle are all wide open. See [CONTRIBUTING.md](CONTRIBUTING.md).

```sh
bun test               # game logic and renderer tests
bun arcade/arcade.ts   # play it standalone, no tmux needed
```

## License

MIT, by Amaar Chughtai. Ships with [chess.js](https://github.com/jhlywa/chess.js) (BSD-2-Clause, see `vendor/chess.js.LICENSE`). If it made your Claude Code wait less boring, a ⭐ helps others find it.
