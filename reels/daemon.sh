#!/usr/bin/env bash
# Reels enforcement daemon. One per session, launched detached by start.sh /
# play.sh. While the session is "paused" (Claude idle) it keeps re-pausing the
# reel every tick, so even if you sneak over and hit play it freezes again right
# away. In strict lock mode it also bounces focus back to the terminal whenever
# the reels tab is the frontmost window. While "playing" it does nothing and lets
# you watch. Exits when the session's runtime dir disappears or reels is disabled.
set -u

. "${CLAUDE_PLUGIN_ROOT}/reels/lib.sh"
set_reels_rdir

# Poll interval in seconds, derived from the pollMs config (default 1200ms).
poll_ms="$(reels_cfg pollMs 1200)"
case "$poll_ms" in '' | *[!0-9]*) poll_ms=1200 ;; esac
poll_s="$(awk "BEGIN{printf \"%.2f\", $poll_ms/1000}")"

lock="$(reels_cfg lock soft)"

while :; do
  reels_on || break
  [ -f "$REELS_RDIR/state" ] || break
  state="$(cat "$REELS_RDIR/state" 2>/dev/null)"

  if [ "$state" = "paused" ]; then
    reels_control pause >/dev/null 2>&1 || true
    if [ "$lock" = "strict" ]; then
      if [ "$(reels_control is-reels-front 2>/dev/null)" = "yes" ]; then
        reels_focus_work
      fi
    fi
  fi

  sleep "$poll_s"
done

rm -f "$REELS_RDIR/daemon.pid" 2>/dev/null || true
exit 0
