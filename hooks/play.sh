#!/usr/bin/env bash
# UserPromptSubmit hook: Claude is about to work — let the arcade run.
# Must stay silent on stdout (UserPromptSubmit stdout is injected into the prompt).
set -u

. "${CLAUDE_PLUGIN_ROOT}/hooks/lib.sh"
arcade_dirs
mkdir -p "$ARC_RDIR"
echo playing >"$ARC_RDIR/state"

# Optionally jump focus to the arcade pane so the player can play immediately.
if [ -n "${TMUX:-}" ] && [ -f "$ARC_RDIR/pane" ]; then
  BUN="$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")"
  focus="$("$BUN" "${CLAUDE_PLUGIN_ROOT}/hooks/read-config.ts" autoFocus 2>/dev/null)"
  if [ "$focus" != "false" ]; then
    tmux select-pane -t "$(cat "$ARC_RDIR/pane")" 2>/dev/null || true
  fi
fi

exit 0
