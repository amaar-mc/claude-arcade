#!/usr/bin/env bash
# Stop hook (reels): Claude finished, so freeze the reel and pull focus back to
# the terminal. The daemon keeps it frozen until the next prompt. No-op unless
# enabled + macOS.
set -u

. "${CLAUDE_PLUGIN_ROOT}/reels/lib.sh"
reels_on || exit 0
is_macos || exit 0

set_reels_rdir
mkdir -p "$REELS_RDIR"
echo paused >"$REELS_RDIR/state"

reels_control pause >/dev/null
reels_focus_work

exit 0
