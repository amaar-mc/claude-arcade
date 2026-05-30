---
description: View or change Claude Arcade settings (games, speed, difficulty)
---

Most settings are editable live in the arcade pane itself — press **c** there for
the settings screen. This command edits the same config from chat.

Config lives at `~/.claude-arcade/config.json`. Fields:

- `defaultGame` — which game opens first: `snake`, `tictactoe`, `connectfour`, `twenty48`, or `chess`.
- `paneWidth` — width in columns of the arcade tmux pane (applies to new sessions).
- `autoFocus` — `true` jumps focus to the arcade on prompt submit and back to Claude when it finishes; `false` leaves you to switch panes manually.
- `snake.tickMs` — milliseconds per move; lower is faster (40–400).
- `snake.wrap` — `true` lets the snake pass through walls.
- `connectFour.aiDepth` — engine search depth, 1 (easy) to 8 (hard).
- `chess.aiDepth` — engine search depth, 1 (easy) to 4 (hard).

Do this:

1. Read `~/.claude-arcade/config.json` and show the current values.
2. If the user asked for a change in `$ARGUMENTS`, edit the JSON, validating against the constraints above.
3. Note that game/speed/difficulty changes take effect on the next game (switch games with Tab, or press `r` to restart the current one), and `paneWidth` applies next session.

User request: $ARGUMENTS
