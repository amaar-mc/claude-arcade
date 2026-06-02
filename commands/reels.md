---
description: Enable, disable, or check Claude Reels (Instagram Reels that play only while Claude works)
---

Claude Reels is the inverse of the arcade (macOS only): an Instagram Reels tab
plays in your browser **while Claude is working** and freezes the instant Claude
stops, snapping focus back to your terminal. No prompt running = no reels. It is
opt-in and replaces the tmux arcade pane while it is on.

Run the toggle script and report its output:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/reels/toggle.sh" <on|off|status>
```

- `$ARGUMENTS` is `on`, `off`, or `status` (default `status`).
- After `on`, if the JS bridge shows BLOCKED, tell the user to enable it:
  - **Chrome/Brave/Edge:** menu bar → View → Developer → check **Allow JavaScript from Apple Events**, then restart the browser.
  - **Safari:** Settings → Advanced → **Show features for web developers**, then Develop menu → check **Allow JavaScript from Apple Events**.
  - The first prompt will also trigger a macOS prompt asking the terminal to control the browser / System Events — click **OK**.
- Reels settings live in `~/.claude-arcade/config.json` under the `reels` key:
  - `browser` - `chrome`, `brave`, `edge`, or `safari` (default `chrome`).
  - `url` - reels URL to open (default `https://www.instagram.com/reels/`).
  - `lock` - `soft` keeps the reel frozen while idle; `strict` also bounces focus back to the terminal if you open the reels tab while idle.
  - `pollMs` - how often the lock re-checks while idle (default 1200).

User request: $ARGUMENTS
