#!/usr/bin/env bash
# SessionStart hook: create the arcade side-pane once per tmux window, and bind
# Alt-j to toggle (hide/show) it. Must stay silent on stdout (SessionStart
# stdout is injected into Claude's context).
set -u

dir="$HOME/.claude-arcade"
mkdir -p "$dir"

# Seed config on first run.
if [ ! -f "$dir/config.json" ] && [ -f "${CLAUDE_PLUGIN_ROOT}/config.default.json" ]; then
  cp "${CLAUDE_PLUGIN_ROOT}/config.default.json" "$dir/config.json"
fi

# Remember the plugin root so toggle.sh (bound to a key, no env) can recreate.
echo "${CLAUDE_PLUGIN_ROOT}" >"$dir/root"

# Only works inside tmux — that is what gives us the split UI.
if [ -z "${TMUX:-}" ]; then
  exit 0
fi

BUN="$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")"

# Bind Alt-j to the toggle for this tmux server (idempotent — just re-sets it).
tmux bind-key -n M-j run-shell "bash '${CLAUDE_PLUGIN_ROOT}/hooks/toggle.sh'" 2>/dev/null || true

# Already have a live arcade pane? Do nothing.
if [ -f "$dir/pane" ]; then
  saved="$(cat "$dir/pane" 2>/dev/null)"
  if tmux list-panes -a -F '#{pane_id}' 2>/dev/null | grep -qx "$saved"; then
    exit 0
  fi
fi

tmux display-message -p '#{pane_id}' >"$dir/claude_pane" 2>/dev/null

# Arcade opens on its menu (paused); the first prompt sets it playing.
echo paused >"$dir/state"

width="$("$BUN" "${CLAUDE_PLUGIN_ROOT}/hooks/read-config.ts" paneWidth 2>/dev/null)"
[ -z "$width" ] && width=52
echo "$width" >"$dir/panewidth"

game_pane="$(tmux split-window -h -d -l "$width" -P -F '#{pane_id}' \
  "exec '$BUN' '${CLAUDE_PLUGIN_ROOT}/arcade/arcade.ts' || read -n1 -s" 2>/dev/null)"

[ -n "$game_pane" ] && echo "$game_pane" >"$dir/pane"

exit 0
