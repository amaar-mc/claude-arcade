#!/usr/bin/env bash
# Toggle the arcade pane (bound to Alt-j by ensure-pane.sh). Hide it (park in a
# detached window, game state kept alive) when visible, bring it back beside
# Claude when hidden, or recreate it if it was closed while Claude is still here.
# Silent on stdout.
set -u

ARC_DIR="$HOME/.claude-arcade"
root="$(cat "$ARC_DIR/root" 2>/dev/null)"
[ -z "$root" ] && exit 0
. "$root/hooks/lib.sh"
arcade_dirs

pane="$(cat "$ARC_RDIR/pane" 2>/dev/null)"
claude="$(cat "$ARC_RDIR/claude_pane" 2>/dev/null)"

# No live arcade pane: recreate only if the Claude pane is still around.
if ! pane_alive "$pane"; then
  if pane_alive "$claude"; then
    CLAUDE_PLUGIN_ROOT="$root" bash "$root/hooks/ensure-pane.sh"
  fi
  exit 0
fi

arcade_win="$(tmux display-message -t "$pane" -p '#{window_id}' 2>/dev/null)"
claude_win="$(tmux display-message -t "$claude" -p '#{window_id}' 2>/dev/null)"

if [ -n "$claude_win" ] && [ "$arcade_win" = "$claude_win" ]; then
  # Visible -> hide (keep the process running in its own detached window).
  tmux break-pane -d -s "$pane" 2>/dev/null || true
elif pane_alive "$claude"; then
  # Hidden -> show next to Claude.
  width="$(cat "$ARC_RDIR/panewidth" 2>/dev/null)"
  case "$width" in '' | *[!0-9]*) width=52 ;; esac
  tmux join-pane -h -l "$width" -s "$pane" -t "$claude" 2>/dev/null || true
  tmux select-pane -t "$claude" 2>/dev/null || true
else
  # Claude pane is gone - just jump to the parked arcade window.
  tmux select-window -t "$pane" 2>/dev/null || true
fi

exit 0
