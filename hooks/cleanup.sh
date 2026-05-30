#!/usr/bin/env bash
# SessionEnd hook: tear down this session's arcade pane (visible or parked) and
# remove its runtime dir, so a later Alt-j won't resurrect a stale pane.
set -u

. "${CLAUDE_PLUGIN_ROOT}/hooks/lib.sh"
arcade_dirs

if [ -n "${TMUX:-}" ] && [ -f "$ARC_RDIR/pane" ]; then
  tmux kill-pane -t "$(cat "$ARC_RDIR/pane")" 2>/dev/null || true
fi

rm -rf "$ARC_RDIR" 2>/dev/null || true

exit 0
