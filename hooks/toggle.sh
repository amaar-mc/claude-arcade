#!/usr/bin/env bash
# Toggle the arcade pane (bound to Alt-j). This runs from a tmux key binding, so
# it has no Claude stdin: it finds the arcade belonging to the window the key was
# pressed in by matching the recorded Claude/arcade panes. Hides a visible pane
# (parks it in a detached window, state kept alive), shows a hidden one, or
# recreates one closed while Claude is still running. Silent on stdout.
set -u

ARC_DIR="$HOME/.claude-arcade"
root="$(cat "$ARC_DIR/root" 2>/dev/null)"
[ -z "$root" ] && exit 0
. "$root/hooks/lib.sh"

active="$(tmux display-message -p '#{pane_id}' 2>/dev/null)"
awin="$(win_of "$active")"
[ -z "$awin" ] && exit 0

# Find the session whose Claude pane (or arcade pane) lives in this window.
target=""; tcl=""; tpane=""
for d in "$ARC_DIR"/sessions/*/; do
  [ -d "$d" ] || continue
  cp="$(cat "$d/claude_pane" 2>/dev/null)"
  ap="$(cat "$d/pane" 2>/dev/null)"
  cw="$(win_of "$cp")"
  aw="$(win_of "$ap")"
  if { [ -n "$cw" ] && [ "$cw" = "$awin" ]; } || { [ -n "$aw" ] && [ "$aw" = "$awin" ]; }; then
    target="$d"; tcl="$cp"; tpane="$ap"; break
  fi
done
[ -z "$target" ] && exit 0

# Arcade pane gone: recreate beside Claude if Claude is still here.
if ! pane_alive "$tpane"; then
  if pane_alive "$tcl"; then
    CLAUDE_PLUGIN_ROOT="$root" ARC_CLAUDE_PANE="$tcl" bash "$root/hooks/ensure-pane.sh"
  fi
  exit 0
fi

arcade_win="$(win_of "$tpane")"
claude_win="$(win_of "$tcl")"

if [ -n "$claude_win" ] && [ "$arcade_win" = "$claude_win" ]; then
  # Visible -> hide (keep the process running in its own detached window).
  tmux break-pane -d -s "$tpane" 2>/dev/null || true
elif pane_alive "$tcl"; then
  # Hidden -> show next to Claude.
  width="$(cat "$target/panewidth" 2>/dev/null)"
  case "$width" in '' | *[!0-9]*) width=52 ;; esac
  tmux join-pane -h -l "$width" -s "$tpane" -t "$tcl" 2>/dev/null || true
  tmux select-pane -t "$tcl" 2>/dev/null || true
else
  # Claude pane is gone, just jump to the parked arcade window.
  tmux select-window -t "$tpane" 2>/dev/null || true
fi

exit 0
