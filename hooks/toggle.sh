#!/usr/bin/env bash
# Toggle the arcade pane: hide it (park in a detached window, game state kept
# alive) when visible, bring it back beside Claude when hidden, or recreate it
# if it was fully closed. Bound to Alt-j by ensure-pane.sh. Silent on stdout.
set -u

dir="$HOME/.claude-arcade"
[ -z "${TMUX:-}" ] && exit 0

pane="$(cat "$dir/pane" 2>/dev/null)"
claude="$(cat "$dir/claude_pane" 2>/dev/null)"
root="$(cat "$dir/root" 2>/dev/null)"

# No live arcade pane? Recreate it.
if [ -z "$pane" ] || ! tmux list-panes -a -F '#{pane_id}' 2>/dev/null | grep -qx "$pane"; then
  [ -n "$root" ] && CLAUDE_PLUGIN_ROOT="$root" bash "$root/hooks/ensure-pane.sh"
  exit 0
fi

arcade_win="$(tmux display-message -t "$pane" -p '#{window_id}' 2>/dev/null)"
claude_win="$(tmux display-message -t "$claude" -p '#{window_id}' 2>/dev/null)"

if [ -n "$claude_win" ] && [ "$arcade_win" = "$claude_win" ]; then
  # Visible -> hide (keep the process running in its own detached window).
  tmux break-pane -d -s "$pane" 2>/dev/null || true
else
  # Hidden -> show next to Claude.
  width="$(cat "$dir/panewidth" 2>/dev/null)"
  [ -z "$width" ] && width=52
  tmux join-pane -h -l "$width" -s "$pane" -t "$claude" 2>/dev/null || true
  tmux select-pane -t "$claude" 2>/dev/null || true
fi

exit 0
