#!/usr/bin/env bash
# Shared helpers for the claude-arcade hooks.

# Sets ARC_DIR (global config/root) and ARC_RDIR (per-tmux-session runtime dir:
# pane ids + play/pause state). Scoping by session id keeps two concurrent
# Claude Code sessions from fighting over one arcade pane or play/pause flag.
#
# ARC_SID, if exported by the caller, wins (the Alt-j binding passes the exact
# pressing session via tmux's #{session_id} so the toggle never guesses). Empty
# query (no tmux server) falls back to a non-numeric "none" so it can't alias a
# real session-0 runtime dir.
arcade_dirs() {
  ARC_DIR="$HOME/.claude-arcade"
  local sid="${ARC_SID:-}"
  [ -z "$sid" ] && sid="$(tmux display-message -p '#{session_id}' 2>/dev/null)"
  sid="$(printf '%s' "$sid" | tr -cd '0-9')"
  ARC_RDIR="$ARC_DIR/s${sid:-none}"
}

# True if the given tmux pane id is still live.
pane_alive() {
  [ -n "${1:-}" ] && tmux list-panes -a -F '#{pane_id}' 2>/dev/null | grep -qx "$1"
}
