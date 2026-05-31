#!/usr/bin/env bash
# Stop hook: Claude finished, pause real-time games and hand focus back to the
# Claude pane so the player can read output and type the next prompt.
set -u

. "${CLAUDE_PLUGIN_ROOT}/hooks/lib.sh"
set_rdir "${TMUX_PANE:-}"
mkdir -p "$ARC_RDIR"
echo paused >"$ARC_RDIR/state"

if [ -n "${TMUX:-}" ] && [ -f "$ARC_RDIR/claude_pane" ]; then
  BUN="$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")"
  focus="$("$BUN" "${CLAUDE_PLUGIN_ROOT}/hooks/read-config.ts" autoFocus 2>/dev/null)"
  if [ "$focus" != "false" ]; then
    cp="$(cat "$ARC_RDIR/claude_pane" 2>/dev/null)"
    pane_alive "$cp" && tmux select-pane -t "$cp" 2>/dev/null || true
  fi
fi

exit 0
