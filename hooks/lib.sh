#!/usr/bin/env bash
# Shared helpers for the claude-arcade hooks.

# ARC_DIR holds global config + the plugin root pointer. ARC_RDIR is a runtime
# dir (pane id + play/pause state) keyed on the CLAUDE PANE. One Claude pane gets
# exactly one arcade, reused across new chats / clears / resumes (which all keep
# the same pane). Two separate Claude instances live in different panes, so they
# still get their own arcades.

arcade_base() { ARC_DIR="$HOME/.claude-arcade"; }

sanitize_key() { printf '%s' "${1:-}" | tr -cd 'a-zA-Z0-9' | cut -c1-32; }

# set_rdir <claude-pane-id>
set_rdir() {
  arcade_base
  local k
  k="$(sanitize_key "${1:-}")"
  [ -z "$k" ] && k="default"
  ARC_RDIR="$ARC_DIR/sessions/$k"
}

# The Claude pane: explicit (recreate) > our own pane env > active pane.
claude_pane_id() {
  if [ -n "${ARC_CLAUDE_PANE:-}" ]; then printf '%s' "$ARC_CLAUDE_PANE"; return; fi
  if [ -n "${TMUX_PANE:-}" ]; then printf '%s' "$TMUX_PANE"; return; fi
  tmux display-message -p '#{pane_id}' 2>/dev/null
}

pane_alive() { [ -n "${1:-}" ] && tmux list-panes -a -F '#{pane_id}' 2>/dev/null | grep -qx "$1"; }

win_of() { [ -n "${1:-}" ] && tmux display-message -t "$1" -p '#{window_id}' 2>/dev/null; }
