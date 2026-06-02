#!/usr/bin/env bash
# SessionStart hook (reels): record the work app to return focus to, seed paused
# state, and launch the enforcement daemon. No-op unless reels is enabled and we
# are on macOS. Silent on stdout (SessionStart stdout is injected into context).
set -u

. "${CLAUDE_PLUGIN_ROOT}/reels/lib.sh"
mkdir -p "$REELS_BASE"
printf '%s\n' "${CLAUDE_PLUGIN_ROOT}" >"$REELS_BASE/root"

reels_on || exit 0
is_macos || exit 0

# Seed config on first run so the reels block exists for editing.
if [ ! -f "$REELS_BASE/config.json" ] && [ -f "${CLAUDE_PLUGIN_ROOT}/config.default.json" ]; then
  cp "${CLAUDE_PLUGIN_ROOT}/config.default.json" "$REELS_BASE/config.json"
fi

set_reels_rdir
mkdir -p "$REELS_RDIR"
echo paused >"$REELS_RDIR/state"

# Capture the app that is frontmost right now (the terminal hosting Claude) so we
# can hand focus back to it when Claude stops. Falls back to an env-based guess.
front="$(osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true' 2>/dev/null)"
[ -z "$front" ] && front="$(work_app_guess)"
[ -n "$front" ] && printf '%s\n' "$front" >"$REELS_RDIR/workapp"

# Start the daemon if one is not already running for this session.
pid="$(cat "$REELS_RDIR/daemon.pid" 2>/dev/null)"
if [ -z "$pid" ] || ! kill -0 "$pid" 2>/dev/null; then
  REELS_KEY="$(reels_key)" CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}" \
    nohup bash "${CLAUDE_PLUGIN_ROOT}/reels/daemon.sh" >/dev/null 2>&1 &
  printf '%s\n' "$!" >"$REELS_RDIR/daemon.pid"
fi

exit 0
