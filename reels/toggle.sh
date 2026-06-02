#!/usr/bin/env bash
# Enable / disable / inspect claude-reels. Usage: toggle.sh on|off|status
# Unlike the hooks this prints to stdout - it is meant to be run by hand or by
# the /reels slash command, not wired into a context-injecting hook.
set -u

here="$(cd "$(dirname "$0")/.." && pwd)"
CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$here}"
. "${CLAUDE_PLUGIN_ROOT}/reels/lib.sh"
mkdir -p "$REELS_BASE"
printf '%s\n' "${CLAUDE_PLUGIN_ROOT}" >"$REELS_BASE/root"

cmd="${1:-status}"

print_status() {
  local browser jsstate
  browser="$(reels_cfg browser chrome)"
  if reels_on; then
    echo "claude-reels: ON  (browser: $browser, lock: $(reels_cfg lock soft))"
  else
    echo "claude-reels: OFF (browser: $browser)"
  fi
  if is_macos; then
    jsstate="$(reels_control check 2>/dev/null)"
    case "$jsstate" in
      js-ok) echo "browser JS bridge: OK (Allow JavaScript from Apple Events is on)" ;;
      js-blocked) echo "browser JS bridge: BLOCKED - enable it (see below), reels can't pause/play without it" ;;
      notrunning) echo "browser JS bridge: $browser not running - open it, then re-run /reels status" ;;
      *) echo "browser JS bridge: unknown ($jsstate)" ;;
    esac
  else
    echo "platform: not macOS - reels is macOS-only"
  fi
}

case "$cmd" in
  on)
    : >"$REELS_MARKER"
    echo "Reels enabled. The arcade pane is suppressed while reels is on."
    print_status
    ;;
  off)
    rm -f "$REELS_MARKER" 2>/dev/null || true
    # Freeze any open reel and reap daemons across all sessions.
    if is_macos; then reels_control pause >/dev/null 2>&1 || true; fi
    if [ -d "$REELS_DIR" ]; then
      for d in "$REELS_DIR"/*/; do
        [ -d "$d" ] || continue
        p="$(cat "$d/daemon.pid" 2>/dev/null)"
        [ -n "$p" ] && kill "$p" 2>/dev/null || true
      done
    fi
    echo "Reels disabled. The arcade is back to normal on the next session."
    ;;
  status | *)
    print_status
    ;;
esac

exit 0
