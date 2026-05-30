#!/usr/bin/env bash
# SessionEnd hook: tear down the arcade pane when Claude Code exits. Also kills a
# parked (hidden) arcade pane if it was broken into its own window.
set -u

dir="$HOME/.claude-arcade"

if [ -n "${TMUX:-}" ] && [ -f "$dir/pane" ]; then
  tmux kill-pane -t "$(cat "$dir/pane")" 2>/dev/null || true
fi

rm -f "$dir/pane" "$dir/claude_pane" 2>/dev/null || true

exit 0
