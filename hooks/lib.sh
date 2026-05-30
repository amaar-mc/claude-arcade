#!/usr/bin/env bash
# Shared helpers for the claude-arcade hooks.

# Sets ARC_DIR (global config/root) and ARC_RDIR (per-tmux-session runtime dir:
# pane ids + play/pause state). Scoping by session id keeps two concurrent
# Claude Code sessions from fighting over one arcade pane or play/pause flag.
arcade_dirs() {
  ARC_DIR="$HOME/.claude-arcade"
  local sid
  sid="$(tmux display-message -p '#{session_id}' 2>/dev/null | tr -cd '0-9')"
  ARC_RDIR="$ARC_DIR/s${sid:-0}"
}

# True if the given tmux pane id is still live.
pane_alive() {
  [ -n "$1" ] && tmux list-panes -a -F '#{pane_id}' 2>/dev/null | grep -qx "$1"
}
