#!/usr/bin/env bash
# SessionEnd hook: tear down this Claude pane's arcade (visible or parked) and
# remove its runtime dir, leaving other panes' arcades untouched.
set -u

. "${CLAUDE_PLUGIN_ROOT}/hooks/lib.sh"
set_rdir "${TMUX_PANE:-}"

if [ -n "${TMUX:-}" ] && [ -f "$ARC_RDIR/pane" ]; then
  tmux kill-pane -t "$(cat "$ARC_RDIR/pane")" 2>/dev/null || true
fi

rm -rf "$ARC_RDIR" 2>/dev/null || true

exit 0
