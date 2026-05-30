#!/usr/bin/env bash
# Stop hook: Claude finished responding — pause real-time games and hand focus
# back to the Claude pane so the player can read output and type the next prompt.
set -u

dir="$HOME/.claude-arcade"
mkdir -p "$dir"
echo paused >"$dir/state"

if [ -n "${TMUX:-}" ] && [ -f "$dir/claude_pane" ]; then
  BUN="$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")"
  focus="$("$BUN" "${CLAUDE_PLUGIN_ROOT}/hooks/read-config.ts" autoFocus 2>/dev/null)"
  if [ "$focus" != "false" ]; then
    tmux select-pane -t "$(cat "$dir/claude_pane")" 2>/dev/null || true
  fi
fi

exit 0
