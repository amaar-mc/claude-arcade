#!/usr/bin/env bash
# UserPromptSubmit hook: Claude is about to work, let the arcade run.
# Silent on stdout (UserPromptSubmit stdout is injected into the prompt).
set -u

. "${CLAUDE_PLUGIN_ROOT}/hooks/lib.sh"
set_rdir "${TMUX_PANE:-}"
mkdir -p "$ARC_RDIR"

ap=""
if [ -n "${TMUX:-}" ]; then
  ap="$(cat "$ARC_RDIR/pane" 2>/dev/null)"
  # Self-heal: if the arcade pane was closed/killed, respawn it for this pane.
  # (ensure-pane resets state to paused, so write "playing" AFTER it.)
  if ! pane_alive "$ap"; then
    ARC_CLAUDE_PANE="${TMUX_PANE:-}" bash "${CLAUDE_PLUGIN_ROOT}/hooks/ensure-pane.sh" </dev/null
    ap="$(cat "$ARC_RDIR/pane" 2>/dev/null)"
  fi
fi

echo playing >"$ARC_RDIR/state"

if [ -n "${TMUX:-}" ]; then
  # Focus the arcade pane only if it is visible (same window as Claude).
  BUN="$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")"
  focus="$("$BUN" "${CLAUDE_PLUGIN_ROOT}/hooks/read-config.ts" autoFocus 2>/dev/null)"
  if [ "$focus" != "false" ] && pane_alive "$ap"; then
    cp="$(cat "$ARC_RDIR/claude_pane" 2>/dev/null)"
    if [ -n "$(win_of "$ap")" ] && [ "$(win_of "$ap")" = "$(win_of "$cp")" ]; then
      tmux select-pane -t "$ap" 2>/dev/null || true
    fi
  fi
fi

exit 0
