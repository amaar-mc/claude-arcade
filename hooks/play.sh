#!/usr/bin/env bash
# UserPromptSubmit hook: Claude is about to work — let the arcade run.
# Must stay silent on stdout (UserPromptSubmit stdout is injected into the prompt).
set -u

dir="$HOME/.claude-arcade"
mkdir -p "$dir"
echo playing >"$dir/state"

# Optionally jump focus to the arcade pane so the player can play immediately.
if [ -n "${TMUX:-}" ] && [ -f "$dir/pane" ]; then
  BUN="$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")"
  focus="$("$BUN" "${CLAUDE_PLUGIN_ROOT}/hooks/read-config.ts" autoFocus 2>/dev/null)"
  if [ "$focus" != "false" ]; then
    tmux select-pane -t "$(cat "$dir/pane")" 2>/dev/null || true
  fi
fi

exit 0
