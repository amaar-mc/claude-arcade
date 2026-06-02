#!/usr/bin/env bash
# SessionEnd hook (reels): freeze the reel, stop the daemon, and remove this
# session's runtime dir. Runs even when reels is disabled so a daemon left over
# from a since-disabled session is still reaped.
set -u

. "${CLAUDE_PLUGIN_ROOT}/reels/lib.sh"
is_macos || exit 0

set_reels_rdir
[ -d "$REELS_RDIR" ] || exit 0

echo off >"$REELS_RDIR/state"
reels_control pause >/dev/null 2>&1 || true

pid="$(cat "$REELS_RDIR/daemon.pid" 2>/dev/null)"
[ -n "$pid" ] && kill "$pid" 2>/dev/null || true

rm -rf "$REELS_RDIR" 2>/dev/null || true

exit 0
