#!/usr/bin/env bash
# UserPromptSubmit hook (reels): Claude is about to work, so reward the wait with
# reels. Opens the Instagram tab on the first prompt, brings the browser forward,
# and plays the in-view reel. No-op unless enabled + macOS. Silent on stdout
# (UserPromptSubmit stdout is injected into the prompt).
set -u

. "${CLAUDE_PLUGIN_ROOT}/reels/lib.sh"
reels_on || exit 0
is_macos || exit 0

set_reels_rdir
mkdir -p "$REELS_RDIR"

# Self-heal: relaunch the daemon if it died (e.g. after a reboot of the session).
pid="$(cat "$REELS_RDIR/daemon.pid" 2>/dev/null)"
if [ -z "$pid" ] || ! kill -0 "$pid" 2>/dev/null; then
  REELS_KEY="$(reels_key)" CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}" \
    nohup bash "${CLAUDE_PLUGIN_ROOT}/reels/daemon.sh" >/dev/null 2>&1 &
  printf '%s\n' "$!" >"$REELS_RDIR/daemon.pid"
fi

echo playing >"$REELS_RDIR/state"

url="$(reels_cfg url https://www.instagram.com/reels/)"
reels_control open "$url" >/dev/null
reels_control play >/dev/null

exit 0
