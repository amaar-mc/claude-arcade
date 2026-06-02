#!/usr/bin/env bash
# Shared helpers for the claude-reels hooks (macOS / browser-driven).
#
# Reels is the inverse of the arcade: instead of a game that plays while Claude
# works, an Instagram Reels tab plays while Claude works and freezes the moment
# it stops. State is a per-session play/paused file, mirroring the arcade, but in
# its own dir so the two never collide. Everything is gated behind a marker file
# (~/.claude-arcade/reels-on) so it stays fully opt-in and the arcade is the
# default experience.

REELS_BASE="$HOME/.claude-arcade"
REELS_DIR="$REELS_BASE/reels"
REELS_MARKER="$REELS_BASE/reels-on"

# Plugin root: from the hook env when present, else the pointer the plugin wrote
# at install/session start. The detached daemon relies on the file form.
REELS_ROOT="${CLAUDE_PLUGIN_ROOT:-}"
[ -z "$REELS_ROOT" ] && REELS_ROOT="$(cat "$REELS_BASE/root" 2>/dev/null)"

reels_on() { [ -f "$REELS_MARKER" ]; }
is_macos() { [ "$(uname)" = "Darwin" ]; }

# Per-session runtime dir, keyed on the tmux pane when present (matches the
# arcade) and otherwise on a stable per-terminal id, falling back to "default".
reels_key() {
  # Explicit override wins (the detached daemon is handed its session key).
  if [ -n "${REELS_KEY:-}" ]; then printf '%s' "$REELS_KEY"; return; fi
  local k="${TMUX_PANE:-}"
  [ -z "$k" ] && k="${TERM_SESSION_ID:-}"
  [ -z "$k" ] && k="default"
  printf '%s' "$k" | tr -cd 'a-zA-Z0-9' | cut -c1-40
}

set_reels_rdir() { REELS_RDIR="$REELS_DIR/$(reels_key)"; }

# Read one reels.* config value with a caller-supplied fallback. Reads the same
# config.json the arcade uses; the values live under a top-level "reels" object.
reels_cfg() {
  local field="$1" fallback="$2" out
  local BUN
  BUN="$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")"
  out="$("$BUN" "$REELS_ROOT/reels/read-config.ts" "$field" 2>/dev/null)"
  [ -n "$out" ] && printf '%s' "$out" || printf '%s' "$fallback"
}

# Run the AppleScript browser controller. Args: <action> [url]. Browser comes
# from config. Returns the controller's stdout (e.g. "play", "js-blocked").
reels_control() {
  local action="$1" url="${2:-}" browser
  browser="$(reels_cfg browser chrome)"
  osascript "$REELS_ROOT/reels/control.applescript" "$browser" "$action" "$url" 2>/dev/null
}

# Bring the user's work app (the terminal hosting Claude) back to the front.
reels_focus_work() {
  local app
  app="$(cat "$REELS_RDIR/workapp" 2>/dev/null)"
  [ -z "$app" ] && app="$(work_app_guess)"
  [ -z "$app" ] && return 0
  osascript -e "tell application \"$app\" to activate" 2>/dev/null || true
}

# Best-effort guess of the work app from the environment, used only if we never
# captured the live frontmost app at session start.
work_app_guess() {
  case "${TERM_PROGRAM:-}" in
    Apple_Terminal) printf 'Terminal' ;;
    iTerm.app) printf 'iTerm2' ;;
    vscode) printf 'Code' ;;
    WezTerm) printf 'WezTerm' ;;
    ghostty | Ghostty) printf 'Ghostty' ;;
    *) printf '%s' "${TERM_PROGRAM:-}" ;;
  esac
}
