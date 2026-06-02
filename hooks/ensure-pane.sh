#!/usr/bin/env bash
# SessionStart hook: ensure exactly one arcade pane exists for this Claude pane,
# and bind Alt-j to toggle it. Also invoked by toggle.sh to recreate a closed
# pane (ARC_CLAUDE_PANE passed in). Silent on stdout (SessionStart stdout is
# injected into Claude's context).
set -u

. "${CLAUDE_PLUGIN_ROOT}/hooks/lib.sh"
arcade_base
mkdir -p "$ARC_DIR"

# Reels mode replaces the tmux pane with browser-based Instagram Reels; stand down.
[ -f "$ARC_DIR/reels-on" ] && exit 0

# Seed config on first run (global, shared across panes).
if [ ! -f "$ARC_DIR/config.json" ] && [ -f "${CLAUDE_PLUGIN_ROOT}/config.default.json" ]; then
  cp "${CLAUDE_PLUGIN_ROOT}/config.default.json" "$ARC_DIR/config.json"
fi
printf '%s\n' "${CLAUDE_PLUGIN_ROOT}" >"$ARC_DIR/root"

# Bail only if we have neither a tmux session nor an explicit pane to split from.
if [ -z "${TMUX:-}" ] && [ -z "${ARC_CLAUDE_PANE:-}" ]; then
  exit 0
fi

BUN="$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")"
claude_pane="$(claude_pane_id)"
set_rdir "$claude_pane"
mkdir -p "$ARC_RDIR"

# Bind Alt-j to the toggle (path shell-escaped to prevent command injection).
tq="$(printf '%q' "${CLAUDE_PLUGIN_ROOT}/hooks/toggle.sh")"
tmux bind-key -n M-j run-shell "bash $tq" 2>/dev/null || true

# Already a live arcade pane for this Claude pane? Do nothing. This is what makes
# new chats / clears / resumes (same pane) reuse the one arcade instead of
# spawning another.
if [ -f "$ARC_RDIR/pane" ] && pane_alive "$(cat "$ARC_RDIR/pane")"; then
  exit 0
fi

printf '%s\n' "$claude_pane" >"$ARC_RDIR/claude_pane"
echo paused >"$ARC_RDIR/state"

width="$("$BUN" "${CLAUDE_PLUGIN_ROOT}/hooks/read-config.ts" paneWidth 2>/dev/null)"
case "$width" in '' | *[!0-9]*) width=52 ;; esac
printf '%s\n' "$width" >"$ARC_RDIR/panewidth"

# Launch with exec so the TUI owns the pane tty; %q-escape all paths so spaces or
# quotes can't break out of the command string.
sq="$(printf '%q' "$ARC_RDIR/state")"
bq="$(printf '%q' "$BUN")"
aq="$(printf '%q' "${CLAUDE_PLUGIN_ROOT}/arcade/arcade.ts")"
game_pane="$(tmux split-window -h -d -t "$claude_pane" -l "$width" -P -F '#{pane_id}' \
  "exec env CLAUDE_ARCADE_STATE=$sq $bq $aq" 2>/dev/null)"

[ -n "$game_pane" ] && printf '%s\n' "$game_pane" >"$ARC_RDIR/pane"

exit 0
