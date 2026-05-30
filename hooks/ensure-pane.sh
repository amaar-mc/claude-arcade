#!/usr/bin/env bash
# SessionStart hook: create the arcade side-pane once per tmux session, and bind
# Alt-j to toggle (hide/show) it. Must stay silent on stdout (SessionStart
# stdout is injected into Claude's context).
set -u

. "${CLAUDE_PLUGIN_ROOT}/hooks/lib.sh"
arcade_dirs
mkdir -p "$ARC_DIR" "$ARC_RDIR"

# Seed config on first run (global, shared across sessions).
if [ ! -f "$ARC_DIR/config.json" ] && [ -f "${CLAUDE_PLUGIN_ROOT}/config.default.json" ]; then
  cp "${CLAUDE_PLUGIN_ROOT}/config.default.json" "$ARC_DIR/config.json"
fi

# Remember the plugin root so toggle.sh (bound to a key, no env) can find lib/recreate.
echo "${CLAUDE_PLUGIN_ROOT}" >"$ARC_DIR/root"

# Only works inside tmux - that is what gives us the split UI.
if [ -z "${TMUX:-}" ]; then
  exit 0
fi

BUN="$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")"

# Bind Alt-j to the toggle for this tmux server (idempotent - just re-sets it).
# tmux expands #{session_id} at key-press time, so the toggle always acts on the
# session the key was pressed in (no display-message guessing).
tmux bind-key -n M-j run-shell "ARC_SID='#{session_id}' bash '${CLAUDE_PLUGIN_ROOT}/hooks/toggle.sh'" 2>/dev/null || true

# Already have a live arcade pane for this session? Do nothing.
if [ -f "$ARC_RDIR/pane" ] && pane_alive "$(cat "$ARC_RDIR/pane")"; then
  exit 0
fi

tmux display-message -p '#{pane_id}' >"$ARC_RDIR/claude_pane" 2>/dev/null

# Arcade opens on its menu (paused); the first prompt sets it playing.
echo paused >"$ARC_RDIR/state"

width="$("$BUN" "${CLAUDE_PLUGIN_ROOT}/hooks/read-config.ts" paneWidth 2>/dev/null)"
case "$width" in '' | *[!0-9]*) width=52 ;; esac
echo "$width" >"$ARC_RDIR/panewidth"

game_pane="$(tmux split-window -h -d -l "$width" -P -F '#{pane_id}' \
  "exec env CLAUDE_ARCADE_STATE='$ARC_RDIR/state' '$BUN' '${CLAUDE_PLUGIN_ROOT}/arcade/arcade.ts' || read -r _" 2>/dev/null)"

[ -n "$game_pane" ] && echo "$game_pane" >"$ARC_RDIR/pane"

exit 0
